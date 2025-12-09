/* ===========================================================================
    Handles getting a full page screenshot
    This is inspired by the following article:
    https://screenshotone.com/blog/a-complete-guide-on-how-to-take-full-page-screenshots-with-puppeteer-playwright-or-selenium/
=========================================================================== */

import fs from 'fs-extra';
import sharp from 'sharp';
import { ConsoleMessage, Page, type ScreenshotOptions } from 'puppeteer';
import { setTimeout } from 'node:timers/promises';
import { logError, logMessage } from './lib/log.js';

type PageSizeInfo = {
    pages: number;
    extraHeight: number;
    pageHeight: number;
    viewport: {
        height: number;
        width: number;
    };
};

/**
 * Stitches multiple image buffers vertically into one image.
 *
 * @param scrBuffers
 * @param width
 * @param extraHeight
 */
async function stitchImages(
    scrBuffers: Buffer[],
    width: number,
    extraHeight: number
) {
    const numBuffers = scrBuffers.length;
    // Convert all slices to Sharp objects & metadata
    const sharpImages = await Promise.all(
        scrBuffers.map((buf: Buffer, index: number) => {
            const img = sharp(buf).ensureAlpha().raw();
            if (index === numBuffers - 1 && extraHeight > 0) {
                // This is the last image and it needs to be cropped to the correct height.
                // It has "extraHeight" on the top that needs to be removed so that the final
                // composite image looks correct. This image should be shorter because there was not a
                // full viewport height left at the bottom for the last screenshot.
                img.resize({
                    height: extraHeight,
                    width,
                    position: 'bottom',
                });
            }
            return img.toBuffer({ resolveWithObject: true });
        })
    );

    const totalHeight = sharpImages.reduce(
        (sum, img) => sum + img.info.height,
        0
    );

    // Create composite list with correct vertical offsets
    const composites = [];
    let offset = 0;

    for (const img of sharpImages) {
        composites.push({
            input: img.data,
            top: offset,
            left: 0,
            raw: {
                width: img.info.width,
                height: img.info.height,
                channels: img.info.channels,
            },
        });
        offset += img.info.height;
    }

    // Stitch into final image
    return await sharp({
        create: {
            width,
            height: totalHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 },
        },
    })
        .composite(composites)
        .png()
        .toBuffer();
}

/**
 * Get the page height
 *
 * @param {Page} page The page object
 * @returns {Promise<number>} The page height
 */
const getPageHeight = async (page: Page): Promise<number> =>
    await page.evaluate(() => document.documentElement.scrollHeight);

/**
 * Scrolls the page down by the height of the viewport.
 * Returns true if the page has been scrolled to the bottom.
 *
 * @param {Page} page The page object
 */
async function scrollDown(page: Page) {
    await page.evaluate(() => {
        window.scrollBy({
            left: 0,
            top: window.innerHeight,
            behavior: 'instant',
        });
    });
}

/**
 * Gets the page size info.
 *
 * @param {Page} page The page object
 * @returns {Promise<PageSizeInfo>} The page size info
 */
const getPageSizeInfo = async (page: Page): Promise<PageSizeInfo> =>
    await page.evaluate(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        const pageHeight = document.documentElement.scrollHeight;
        return {
            pages: Math.ceil(pageHeight / window.innerHeight),
            extraHeight:
                (pageHeight % window.innerHeight) * window.devicePixelRatio,
            pageHeight,
            viewport: {
                height: window.innerHeight * window.devicePixelRatio,
                width: window.innerWidth * window.devicePixelRatio,
            },
        };
    });

/**
 * Takes a full page screenshot of a page.
 *
 * - Scrolls gradually to load lazy images
 * - Detects infinite scroll / expanding layout
 * - Falls back to stitched images if fullPage capture is unreliable
 *
 * @param {Page} page The page object
 * @param {ScreenshotOptions} screenshotConfig The screenshot configuration
 */
const getFullPageScreenshot = async (
    page: Page,
    screenshotConfig: ScreenshotOptions
) => {
    // Maximum number of scroll loops to perform.
    // This is a safety measure to prevent the script from getting stuck in an infinite loop
    // with a very tall or infinite scroll page.
    const maxScrollLoops = 50;
    // The pixel threshold at which we will stitch the screenshots together.
    // If the page height is less than this threshold, we will take a single screenshot using the fullPage option.
    // If the page height is greater than this threshold, we will stitch the screenshots together using the stitchedImages function.
    const stitchThreshold = 16000;

    try {
        // Handle console logs from the page so that they are printed in the console.
        // Useful for debugging when developing.
        // https://stackoverflow.com/a/61665218
        page.on('console', (consoleObj: ConsoleMessage) => {
            if (consoleObj.type() === 'log') {
                logMessage(consoleObj.text());
            }
        });

        // Get the initial page size info
        let pageSizeInfo = await getPageSizeInfo(page);

        // Set up the variables for the scroll loop
        let lastHeight = pageSizeInfo.viewport.height;
        let sameHeightCount = 0;

        // Do the scroll loop to trigger lazy loading of images
        // and to get the final page size info.
        // This handles infinite scroll pages.
        for (let index = 0; index < maxScrollLoops; index += 1) {
            await scrollDown(page);
            await setTimeout(400);

            // Get the new page height and compare it to the last height.
            // If the height stabilizes for several loops, stop scrolling.
            const newHeight = await getPageHeight(page);
            if (newHeight === lastHeight) {
                sameHeightCount++;
            } else {
                sameHeightCount = 0;
            }

            // If height stabilizes for several loops, stop scrolling
            if (sameHeightCount >= 3) break;

            // Update the last height to the new height for the next loop.
            lastHeight = newHeight;
        }

        // Get the final page size info
        pageSizeInfo = await getPageSizeInfo(page);

        // Scroll back to top before capturing
        await page.evaluate(() =>
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        );
        await setTimeout(100);

        // If the page is reasonably sized, prefer fullPage screenshot
        const fullHeight = await getPageHeight(page);
        if (fullHeight <= stitchThreshold) {
            await page.screenshot(screenshotConfig);
        } else {
            // The page is tall enough that we need to stitch it together from multiple screenshots.
            // Set up the screenshot configuration. It should not have the path or fullPage options
            // since we will be taking multiple screenshots and stitching them together.
            screenshotConfig.captureBeyondViewport = false;
            const { path } = screenshotConfig;
            delete screenshotConfig.path;
            delete screenshotConfig.fullPage;

            const sectionScreenshots = [];
            for (let index = 0; index < pageSizeInfo.pages; index += 1) {
                // if (index > 0) {
                //     await page.evaluate(() => {
                //         const header = document.querySelector('.js-header');
                //         if (header) {
                //             (header as HTMLElement).style.display = 'none';
                //         }
                //     });
                // }

                // Pause slightly before taking the screenshot to allow the page to settle.
                await setTimeout(100);
                // await page.waitForNetworkIdle({ idleTime: 200 }).catch(() => {});
                // await waitForImages(page);

                const screenshot = await page.screenshot(screenshotConfig);
                sectionScreenshots.push(screenshot);

                await scrollDown(page);
            }

            const stitchedScreenshot = await stitchImages(
                sectionScreenshots,
                pageSizeInfo.viewport.width,
                pageSizeInfo.extraHeight
            );
            fs.writeFileSync(path, stitchedScreenshot);
        }
    } catch (err) {
        logError('Error while taking the full page screenshot', err);
    }
    return null;
};

export default getFullPageScreenshot;
