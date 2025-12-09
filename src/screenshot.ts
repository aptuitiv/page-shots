/* ===========================================================================
    Handle getting the screenshots
    Resources:
    - https://pptr.dev/
    - https://github.com/thomasdondorf/puppeteer-cluster
    - https://screenshotone.com/blog/how-to-take-a-screenshot-with-puppeteer/
    - https://screenshotone.com/blog/puppeteer-wait-until-the-page-is-ready/
    - https://screenshotone.com/blog/a-complete-guide-on-how-to-take-full-page-screenshots-with-puppeteer-playwright-or-selenium/
=========================================================================== */

import fs from 'fs-extra';
import { dirname, extname, join } from 'path';
import { Cluster } from 'puppeteer-cluster';
import sanitize from 'sanitize-filename';
import { GoToOptions, Page, type ScreenshotOptions } from 'puppeteer';
import puppeteerExtraModule, { type PuppeteerExtra } from 'puppeteer-extra';
import AdblockerPluginModule from 'puppeteer-extra-plugin-adblocker';
import type { PluginOptions } from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { setTimeout } from 'node:timers/promises';

// Library
import { logError, logInfo, logMessage, logSuccess } from './lib/log.js';
import { getElapsedTime, getStartTime } from './lib/time.js';
import { isStringWithValue } from './lib/types.js';
import {
    type Config,
    type SizeConfig,
    type UrlConfig,
    type UrlParamObject,
    ConfigParser,
} from './config.js';
import getFullPageScreenshot from './full-page-screenshot.js';

// This is a workaround to get the type for the puppeteer-extra module
// The default export doesn't have "use" in the type definition. This fixes the type error.
const puppeteerExtra = puppeteerExtraModule as unknown as PuppeteerExtra;

// Type assertion for AdblockerPlugin - TypeScript doesn't recognize the default export as callable
const AdblockerPlugin = AdblockerPluginModule as unknown as (
    options?: Partial<PluginOptions>
) => import('puppeteer-extra-plugin-adblocker').PuppeteerExtraPluginAdblocker;

// The URL data object after it has been set up
type UrlData = UrlConfig & {
    path: string;
};

// The size data object after it has been set up
type SizeData = SizeConfig & {
    path: string;
    url: string;
};

/**
 * Formats the file name by replacing placeholders with values
 *
 * Supported placeholders:
 * {height} - The height of the screenshot. If full screen this height doesn't mean much unless the height of the page is less than this height.
 * {quality} - The JPG quality of the screenshot image
 * {url} - The URL the screenshot is for
 * {width} - The width of the screenshot
 *
 * @param {UrlData|SizeData} url The URL object
 * @param {string} name The name format to use
 * @returns {string} The formatted file name
 */
const formatFileName = (url: UrlData | SizeData, name: string): string => {
    // Set up the "url" portion of the name
    let urlName = url.url.replace(/http(s?):\/\//, '');
    urlName = sanitize(urlName, { replacement: '-' });
    urlName = urlName.replace(/\.+/g, '-');
    urlName = urlName.replace(/-{2,}/g, '-');
    if (urlName.substring(urlName.length - 1) === '-') {
        urlName = urlName.substring(0, urlName.length - 1);
    }
    if (urlName.substring(0, 1) === '-') {
        urlName = urlName.substring(1);
    }

    // Get the URL without the "www." prefix
    const urlNoWww = urlName.replace(/^www-/, '');

    // Get the URL path/stub
    let path = url.url.replace(/http(s?):\/\//, '');
    const pathParts = path.split('/');
    path = path.replace(pathParts[0], '').trim();
    if (path === '/' || path.length === 0) {
        path = 'home';
    } else {
        if (path.substring(0, 1) === '/') {
            path = path.substring(1);
        }
        path = sanitize(path, { replacement: '-' });
        path = path.replace(/\.+/g, '-');
        path = path.replace(/-{2,}/g, '-');
        if (path.substring(path.length - 1) === '-') {
            path = path.substring(0, path.length - 1);
        }
        if (path.substring(0, 1) === '-') {
            path = path.substring(1);
        }
    }

    // Set up the "full/fit" portion of the name
    let full = 'full',
        fit = 'fit';
    if (url.fullScreen) {
        fit = 'full';
    } else {
        full = 'fit';
    }

    // Format the name
    let returnValue = name.replace(/{url}/g, urlName);
    returnValue = returnValue.replace(/{urlNoWww}/g, urlNoWww);
    returnValue = returnValue.replace(/{(path|stub)}/g, path);
    returnValue = returnValue.replace(/{width}/g, url.width.toString());
    returnValue = returnValue.replace(/{height}/g, url.height.toString());
    returnValue = returnValue.replace(/{quality}/g, url.quality.toString());
    returnValue = returnValue.replace(/{full}/g, full);
    returnValue = returnValue.replace(/{fit}/g, fit);
    returnValue = returnValue.replace(/{size}/g, `${url.width}x${url.height}`);

    return returnValue;
};

/**
 * Gets the screenshot of the image
 *
 * Some code borrowed from @link https://www.screenshotbin.com/blog/handling-lazy-loaded-webpages-puppeteer
 * Some code borrowed from @link https://stackoverflow.com/a/49233383
 *
 * @param {Page} page The page object
 * @param {UrlData} url The URL object
 */
const getScreenshot = async (page: Page, url: UrlData) => {
    let message = `Viewport size: ${url.width}px / ${url.height}px`;
    if (url.clip) {
        message += `, Clip: ${url.clip.x}px / ${url.clip.y}px / ${url.clip.width}px / ${url.clip.height}px`;
    }
    if (url.fullScreen) {
        message += `, Full screen`;
    }
    logMessage(`Taking screenshot of ${url.url}`, message);

    // Make sure that the directory for the screenshot exists
    const dir = dirname(url.path);
    if (dir.length > 0 && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Set the viewport size
    await page.setViewport({
        deviceScaleFactor: url.deviceScaleFactor,
        height: url.height,
        width: url.width,
    });

    // Go to the URL
    // See https://screenshotone.com/blog/puppeteer-wait-until-the-page-is-ready/ for more information about waiting until the page is ready.
    const goToOptions: GoToOptions = {
        timeout: 60000,
        waitUntil: url.waitUntil,
    };
    await page.goto(url.url, goToOptions);

    if (url.delay > 0) {
        // Timeout based on https://github.com/puppeteer/puppeteer/pull/11780#issuecomment-1975869042
        logInfo(`Delaying ${url.url} ${url.delay} milliseconds`);
        await setTimeout(url.delay);
    }

    // Save image screenshot
    try {
        // Set up the screenshot configuration
        const screenshotConfig: ScreenshotOptions = {
            fullPage: url.fullScreen,
            path: url.path,
            type: url.fileType,
        };
        if (['jpeg', 'webp'].includes(url.fileType)) {
            screenshotConfig.quality = url.quality;
        }
        if (url.clip) {
            screenshotConfig.fullPage = false;
            screenshotConfig.clip = url.clip;
        }

        if (screenshotConfig.fullPage) {
            await getFullPageScreenshot(page, screenshotConfig);
        } else {
            await page.screenshot(screenshotConfig);
        }
        logSuccess(`Saved ${url.path}`);
    } catch (err) {
        logError('Error while taking the screenshot', err);
    }
};

/**
 * Gets the path to save the screenshot at
 *
 * @param {UrlData|SizeData} url The URL object
 * @returns {string}
 */
const getUrlPath = (url: UrlData | SizeData): string => {
    // Set up the file name
    let filename = '';
    if (isStringWithValue(url.fileName)) {
        filename = url.fileName;
    } else if (isStringWithValue(url.nameFormat)) {
        filename = formatFileName(url, url.nameFormat);
    } else {
        // Fall back to getting the filename from the URL
        filename = formatFileName(url, '{url}');
    }
    // Add the extension
    const ext = extname(filename).toLowerCase().replace('.', '');
    if (
        !isStringWithValue(ext) ||
        !['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    ) {
        // The file name doesn't already have an extension, or the extension is not valid. Use the file type
        filename += `.${url.fileType}`;
    }
    return join(url.dir, filename);
};

/**
 * Sets up the URL object
 *
 * @param {UrlParamObject} url The URL object to setup
 * @param {Config} config The configuration object
 * @returns {UrlData} The URL object
 */
const setupUrl = (url: UrlParamObject, config: Config): UrlData => {
    // Use the ConfigParser to parse the URL object and get the URL configuration
    const configParser = new ConfigParser(config);
    configParser.setDoNotProcessUrls();
    configParser.setDoNotProcessSizes();

    // Parse the URL object and get the URL configuration
    configParser.parse(url);
    const urlConfig = configParser.getConfig();

    // Delete the urls property from the URL configuration because it is not needed for the URL data object
    delete urlConfig.urls;

    // Create the URL data object
    const urlData: UrlData = {
        ...urlConfig,
        url: url.url,
        path: '',
    };

    // Set the path to the path of the URL
    urlData.path = getUrlPath(urlData);

    // Set the URL to be made up of the baseURL and the URL value if necessary
    if (isStringWithValue(urlData.baseUrl)) {
        if (
            urlData.url.substring(0, urlData.baseUrl.length) !==
                urlData.baseUrl &&
            urlData.url.match(/^http(s?):\/\//) === null
        ) {
            // The URL is not a full URL and it does not start with the base URL.
            // Make sure that the URL starts with a "/" as the base URL does not have a "/" at the end.
            if (urlData.url.substring(0, 1) !== '/') {
                urlData.url = `/${urlData.url}`;
            }
            urlData.url = urlData.baseUrl + urlData.url;
        }
    }

    // Make sure that the URL starts with http(s)://
    if (urlData.url.match(/^http(s?):\/\//) === null) {
        urlData.url = `https://${urlData.url}`;
    }

    // Return the URL data object
    return urlData;
};

/**
 * Load the URLs and get the screenshots
 *
 * @param {Config} config The configuration object
 * @returns {Promise<void>}
 */
const getScreenshots = async (config: Config): Promise<void> => {
    try {
        const startTime = getStartTime();
        logMessage(
            `Getting screenshot${config.urls.length === 1 ? '' : 's'} for ${
                config.urls.length
            } URL${config.urls.length === 1 ? '' : 's'}.`
        );

        // Use the StealthPlugin to help prevent detection by anti-bot services
        // https://screenshotone.com/blog/how-to-take-a-screenshot-with-puppeteer/#preventing-puppeteer-detection
        puppeteerExtra.use(StealthPlugin());
        puppeteerExtra.use(AdblockerPlugin());

        // The puppeteer-cluster library is used to launch a cluster of browsers and pages to get the screenshots.
        // This enables us to get the screenshots faster by using multiple browsers and pages in parallel.
        // https://github.com/thomasdondorf/puppeteer-cluster
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 10,
            puppeteer: puppeteerExtra,
        });

        // Set up the task to call for each URL
        await cluster.task(async ({ page, data: url }) => {
            await getScreenshot(page, url);
        });

        // Queue the URLs to be processed
        for (const url of config.urls) {
            const urlObject = setupUrl(url, config);

            if (urlObject.sizes.length > 0) {
                // The URL has one or more configured screenshot sizes.
                // Queue the sizes to be processed
                urlObject.sizes.forEach((size) => {
                    // Use the ConfigParser to parse the size object and get the size configuration
                    const configParser = new ConfigParser(urlObject);
                    configParser.setDoNotProcessUrls();
                    configParser.setDoNotProcessSizes();

                    // Parse the size object and get the size configuration
                    configParser.parse(size);
                    const sizeConfig = configParser.getConfig();

                    // Remove unnecessary configuration values
                    delete sizeConfig.sizes;
                    delete sizeConfig.urls;
                    const sizeData: SizeData = {
                        ...sizeConfig,
                        url: urlObject.url,
                        path: '',
                    };
                    // Set the path to the path of the URL
                    sizeData.path = getUrlPath(sizeData);

                    cluster.queue(sizeData);
                });
            } else {
                // The URL has no configured screenshot sizes.
                // Queue the URL to be processed
                cluster.queue(urlObject);
            }
        }

        await cluster.idle();
        await cluster.close();

        // Output the total time it took to get the screenshots
        const time = getElapsedTime(startTime);
        logMessage(`Total time to get screenshots: ${time}s`);
    } catch (err) {
        logError(`Error getting screenshots`, err);
        process.exit(1);
    }
};

export default getScreenshots;
