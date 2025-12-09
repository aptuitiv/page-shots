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
import { globSync } from 'glob';
import { dirname, extname } from 'node:path';
import { Cluster } from 'puppeteer-cluster';
import { GoToOptions, Page, type ScreenshotOptions } from 'puppeteer';
import puppeteerExtraModule, { type PuppeteerExtra } from 'puppeteer-extra';
import AdblockerPluginModule from 'puppeteer-extra-plugin-adblocker';
import type { PluginOptions } from 'puppeteer-extra-plugin-adblocker';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { setTimeout } from 'node:timers/promises';

// Library
import { logError, logInfo, logMessage, logSuccess } from './lib/log.js';
import { getElapsedTime, getStartTime } from './lib/time.js';

import { ConfigParser } from './config.js';
import {
    ConfigParam,
    type Config,
    type SizeData,
    type UrlData,
} from './types.js';
import getFullPageScreenshot from './full-page-screenshot.js';
import { hideElements, getUrlPath, setupUrl } from './lib/helpers.js';
import {
    isObjectWithValues,
    isStringWithValue,
    isTrueLike,
} from './lib/types.js';

// This is a workaround to get the type for the puppeteer-extra module
// The default export doesn't have "use" in the type definition. This fixes the type error.
const puppeteerExtra = puppeteerExtraModule as unknown as PuppeteerExtra;

// Type assertion for AdblockerPlugin - TypeScript doesn't recognize the default export as callable
const AdblockerPlugin = AdblockerPluginModule as unknown as (
    options?: Partial<PluginOptions>
) => import('puppeteer-extra-plugin-adblocker').PuppeteerExtraPluginAdblocker;

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

    // Hide the elements on the page that match the given CSS selectors
    if (Array.isArray(url.hideSelector)) {
        await hideElements(page, url.hideSelector);
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
            await getFullPageScreenshot(page, url, screenshotConfig);
        } else {
            await page.screenshot(screenshotConfig);
        }
        logSuccess(`Saved ${url.path}`);
    } catch (err) {
        logError('Error while taking the screenshot', err);
    }
};

/**
 * The Screenshot class
 */
class Screenshot {
    /**
     * Holds the cluster object
     *
     * @type {Cluster}
     */
    #cluster: Cluster;

    /**
     * Constructor
     */
    constructor() {
        this.#cluster = null;
    }

    /**
     * Initialize the screenshot class
     *
     * @param {ConfigParam} options The configuration options to initialize the screenshot class with.
     * @returns {Promise<void>}
     */
    async init(options: ConfigParam): Promise<void> {
        // Use the StealthPlugin to help prevent detection by anti-bot services
        // https://screenshotone.com/blog/how-to-take-a-screenshot-with-puppeteer/#preventing-puppeteer-detection
        puppeteerExtra.use(StealthPlugin());
        // Use the AdblockerPlugin to block ads and trackers.
        // This will also block cookie notices.
        // Despite there being options to disable blocking of trackers and annoyances, they don't seem to work. This seems to just block everything.
        // This add blocker library uses https://github.com/ghostery/adblocker/blob/master/packages/adblocker-puppeteer. There may be more options to configure the ad blocker
        // by using that library directly.
        // https://github.com/berstend/puppeteer-extra/blob/master/packages/puppeteer-extra-plugin-adblocker/readme.md
        // We look for the blockAdsAndCookieNotices option in the options object to determine if we should use the AdblockerPlugin. The options object hasn't been
        // fully parsed yet, so we need to check the options object directly. Because of that, the blockAdsAndCookieNotices option can only be set on the command line.
        if (isTrueLike(options.blockAdsAndCookieNotices)) {
            puppeteerExtra.use(AdblockerPlugin());
        }

        // The puppeteer-cluster library is used to launch a cluster of browsers and pages to get the screenshots.
        // This enables us to get the screenshots faster by using multiple browsers and pages in parallel.
        // https://github.com/thomasdondorf/puppeteer-cluster
        this.#cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 10,
            puppeteer: puppeteerExtra,
        });

        // Set up the task to call for each URL
        await this.#cluster.task(async ({ page, data: url }) => {
            await getScreenshot(page, url);
        });
    }

    /**
     * Process the configuration options
     *
     * @param {ConfigParam} options The configuration options to process. They can come from the command line arguments.
     * @param {ConfigParam} [configFileOptions] The configuration options to process from a JSON config file.
     * @returns {Promise<void>}
     */
    async processOptions(
        options: ConfigParam,
        configFileOptions?: ConfigParam
    ): Promise<void> {
        const configParser = new ConfigParser();
        if (isObjectWithValues(configFileOptions)) {
            // Parse the configuration options from the JSON config file first.
            configParser.parse(configFileOptions);
        }
        // Parse the configuration options from the command line arguments in case there are any overrides,
        // or if there were not any configuration options from the JSON config file.
        configParser.parse(options);

        if (configParser.hasUrls()) {
            this.getScreenshots(configParser.getConfig());
        } else {
            logError(
                'No URLs were provided to get screenshots of. Nothing to do.'
            );
        }
    }

    /**
     * Load the URLs and get the screenshots
     *
     * @param {Config} config The configuration object
     * @returns {Promise<void>}
     */
    async getScreenshots(config: Config): Promise<void> {
        try {
            logMessage(
                `Getting screenshot${config.urls.length === 1 ? '' : 's'} for ${
                    config.urls.length
                } URL${config.urls.length === 1 ? '' : 's'}.`
            );

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

                        this.#cluster.queue(sizeData);
                    });
                } else {
                    // The URL has no configured screenshot sizes.
                    // Queue the URL to be processed
                    this.#cluster.queue(urlObject);
                }
            }
        } catch (err) {
            logError(`Error getting screenshots`, err);
            process.exit(1);
        }
    }

    async end() {
        await this.#cluster.idle();
        await this.#cluster.close();
    }
}

/**
 * Entry point for processing the screenshots
 *
 * @param {ConfigParam} options The configuration options to process. These come from the command line arguments.
 */
const screenshotHandler = async (options: ConfigParam): Promise<void> => {
    const startTime = getStartTime();
    const screenshot = new Screenshot();
    await screenshot.init(options);

    let configFiles = [];
    if (Array.isArray(options.config)) {
        // One or more configuration file references were provided.
        // Get the list of configuration files from the glob file references.
        configFiles = options.config
            .map((config) => {
                let configOption = config;
                if (
                    isStringWithValue(configOption) &&
                    !configOption.includes('*')
                ) {
                    // Make sure that the file name has a .json extension
                    if (!configOption.endsWith('.json')) {
                        configOption += '.json';
                    }
                }

                return globSync(configOption);
            })
            .flat();
    }

    const promises = [];
    if (configFiles.length > 0) {
        // One or more JSON config files were provided. Process each one.
        configFiles.forEach(async (file) => {
            try {
                let configFile = 'shots.json';
                if (typeof file === 'string' && file.length > 0) {
                    configFile = file;
                    const ext = extname(file).toLowerCase().replace('.', '');
                    if (ext.length === 0) {
                        configFile += '.json';
                    }
                }
                if (fs.existsSync(configFile)) {
                    logMessage(`Processing config file: ${configFile}`);
                    promises.push(
                        screenshot.processOptions(
                            options,
                            fs.readJsonSync(configFile)
                        )
                    );
                } else {
                    logError(
                        `The JSON config file "${configFile}" could not be found`
                    );
                }
            } catch (err) {
                logError(
                    `Error while processing the JSON config file ${file}`,
                    err
                );
                process.exit();
            }
        });
    } else {
        promises.push(screenshot.processOptions(options));
    }

    await Promise.all(promises);
    await screenshot.end();
    // Output the total time it took to get the screenshots
    const time = getElapsedTime(startTime);
    logMessage(`Total time to get screenshots: ${time}s`);
};

export default screenshotHandler;
