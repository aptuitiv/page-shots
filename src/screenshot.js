/* ===========================================================================
    Handle getting the screenshots
=========================================================================== */

import fs from 'fs-extra';
import { dirname, extname, join } from 'path';
import { Cluster } from 'puppeteer-cluster';
import sanitize from 'sanitize-filename';

// Library
import { logError, logMessage, logSuccess } from './lib/log.js';
import { isBoolean, isDefined, isStringWithValue } from './lib/types.js';

/**
 * Screenshot object
 */
const screenshot = {
    /**
     * The configuration object
     *
     * @type {object}
     */
    config: {},

    /**
     * Load the URLs and get the screenshots
     * 
     * @param {object} config The configuration object
     */
    async run(config) {
        this.config = config;

        try {
            const startTime = process.hrtime();

            // The puppeteer-cluster library is used to launch a cluster of browsers and pages to get the screenshots.
            // This enables us to get the screenshots faster by using multiple browsers and pages in parallel.
            // https://github.com/thomasdondorf/puppeteer-cluster
            const cluster = await Cluster.launch({
                concurrency: Cluster.CONCURRENCY_CONTEXT,
                maxConcurrency: 10,
            });

            // Set up the task to call for each URL
            await cluster.task(async ({ page, data: url }) => {
                await this.getScreenshot(page, url);
            });


            for (const url of this.config.urls) {
                const urlObject = this.setupUrl(url);

                if (urlObject.sizes.length > 0) {
                    // for (const size of urlObject.sizes) {
                    //     urlsToProcess.push(this.setupSize(urlObject, size));
                    // }
                } else {
                    cluster.queue(urlObject);
                }

                // if (url.sizes.length > 0) {
                //     const { delay } = urlObject;
                //     const { dir } = urlObject;
                //     const { fullScreen } = urlObject;
                //     const { name } = urlObject;
                //     const { quality } = urlObject;
                //     const { type } = urlObject;



                //     for (size of url.sizes) {
                //         url.width = size.width;
                //         url.height = size.height;

                //         // Override the delay if necessary
                //         if (typeof size.delay !== 'undefined') {
                //             size.delay = parseInt(size.delay);
                //             if (size.delay > 0) {
                //                 if (size.delay > this.maxDelay) {
                //                     size.delay = this.maxDelay;
                //                 }
                //                 url.delay = size.delay;
                //             } else {
                //                 url.delay = delay;
                //             }
                //         } else {
                //             url.delay = delay;
                //         }

                //         // Check to see if the size has a separate directory
                //         if (typeof size.dir === 'string' && size.dir.length > 0) {
                //             url.dir = size.dir;
                //         } else {
                //             url.dir = dir;
                //         }

                //         // Check to see if the size should be full screen
                //         if (typeof size.full !== 'undefined' || typeof size.fit !== 'undefined') {
                //             url.fullScreen = this._getFullScreen(size);
                //         } else {
                //             url.fullScreen = fullScreen;
                //         }

                //         if (typeof size.quality !== 'undefined') {
                //             size.quality = parseInt(size.quality);
                //             if (size.quality > 0 && size.quality <= 100) {
                //                 url.quality = size.quality;
                //             } else {
                //                 url.quality = quality;
                //             }
                //         } else {
                //             url.quality = quality;
                //         }

                //         // See if the size name was set
                //         if (typeof size.key === 'string' && size.key.length > 0) {
                //             url.sizeName = size.key;
                //         } else {
                //             url.sizeName = '';
                //         }

                //         // Override the name if necessary
                //         if (typeof size.name === 'string' && size.name.length > 0) {
                //             url.name = size.name;
                //         } else {
                //             url.name = name;
                //         }

                //         // Check the size is specifying a type
                //         typeTemp = this._validateType(size.type);
                //         if (typeTemp) {
                //             url.type = typeTemp;
                //         } else {
                //             url.type = type;
                //         }

                //         // Regenerate the file name and path
                //         url = this._regenerateFilename(url);

                //         // Make sure that the directory exists
                //         this._createDir(dirname(url.path));

                //         // Take the screenshot
                //         await this._screenshot(url);
                //     }
                // } else {
                //     this.createDir(urlObject);


                //     await this.getScreenshot(urlObject);
                // }
                // Get the screenshots

            }

            await cluster.idle();
            await cluster.close();

            // Output the total time it took to get the screenshots
            const diff = process.hrtime(startTime);
            const time = diff[0] + diff[1] / 1e9;
            logMessage(`Total time to get screenshots: ${time}s`);
        } catch (err) {
            logError(`Error getting screenshots`, err);
            process.exit(1);
        }
    },

    /**
     * Gets the screenshot of the image
     *
     * Some code borrowed from @link https://www.screenshotbin.com/blog/handling-lazy-loaded-webpages-puppeteer
     * Some code borrowed from @link https://stackoverflow.com/a/49233383
     *
     * @param page.page
     * @param page
     * @param {object} url The URL object
     * @param url.page
     * @param url.data
     * @param page.data
     */
    async getScreenshot(page, url) {
        const pageStartTime = process.hrtime();
        // Set up the page load event listener
        page.on('load', () => {
            // Get the page elapsed time
            const diff = process.hrtime(pageStartTime);
            const time = diff[0] + diff[1] / 1e9;
            logSuccess(`${url.url} loaded in ${time}s`);
        });

        // Set the viewport size
        await page.setViewport({
            width: url.width,
            height: url.height
        });

        // Go to the URL
        logMessage(`Loading ${url.url}. Viewport size: ${url.width}px / ${url.height}px`);
        await page.goto(url.url);

        // Save image screenshot
        try {
            logMessage(`Taking screenshot of ${url.path} (${url.width}px / ${url.height}px)`);
            await page.screenshot(this.getScreenshotConfig(url));
            logSuccess(`Saved ${url.path} (${url.width}px / ${url.height}px)`);
        } catch (err) {
            logError('Error while taking the screenshot', err);
        }
    },

    /**
     * Gets the configuration object for taking a screenshot
     *
     * @param {object} url The URL information
     * @returns {object}
     */
    getScreenshotConfig(url) {
        const config = {
            fullPage: url.fullScreen,
            path: url.path,
            type: url.type
        };
        if (url.type === 'jpg') {
            config.quality = url.quality;
            config.type = 'jpeg';
        }
        if (url.clip) {
            config.fullPage = false;
            config.clip = url.clip;
        }
        return config;
    },

    /**
     * Creates the directory for the URL if it doesn't exist
     *
     * @param {object} url The URL object
     */
    createDir(url) {
        const dir = dirname(url.path);
        if (dir.length > 0 && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    },

    /**
     * Sets up the URL object
     *
     * @param {object} url The URL object to setup
     * @returns {object} The URL object
     */
    setupUrl(url) {
        // Get the base URL if available
        if (!isStringWithValue(url.baseUrl)) {
            url.baseUrl = this.config.baseUrl;
        }
        // Set the URL to be made up of the baseURL and the URL value if necessary
        if (isStringWithValue(url.baseUrl)) {
            if (url.url.substring(0, url.baseUrl.length) !== url.baseUrl && url.url.match(/^http(s?):\/\//) === null) {
                if (url.url.substring(0, 1) !== '/') {
                    url.url = `/${url.url}`;
                }
                url.url = url.baseUrl + url.url;
            }
        }

        // Set up the clip object if available
        let { clip } = this.config;
        if (isDefined(url.clip)) {
            clip = url.clip;
            delete url.clip;
        }
        clip = this.config.processClip(clip);
        if (clip !== false) {
            url.clip = clip;
        }

        // Set up the delay value
        url.delay = this.config.processDelay(url?.delay);
        if (this.config.delay > url.delay) {
            url.delay = this.config.delay;
        }

        // Set up the directory value
        url.dir = this.getDir(url);

        // Get the full screen value
        let fullScreen = this.config.processFitAndFullScreen(url);
        if (fullScreen === null) {
            fullScreen = this.config.fullScreen;
        }
        if (isBoolean(fullScreen)) {
            url.fullScreen = fullScreen;
        }

        // Set up the height value
        url.height = this.config.processHeightWidth(url?.height);
        if (url.height === 0 && this.config.height > 0) {
            url.height = this.config.height;
        }

        // Set up the file type value
        url.type = this.getFileType(url);

        // Set up the quality value
        url.quality = this.config.processQuality(url?.quality);
        if (this.config.quality < url.quality) {
            url.quality = this.config.quality;
        }

        // Set up the viewport sizes
        url.sizes = this.config.processViewportSizes(url?.sizes);
        if (url.sizes.length === 0 && this.config.sizes.length > 0) {
            url.sizes = this.config.sizes;
        }

        // Set up the width value
        url.width = this.config.processHeightWidth(url?.width);
        if (url.width === 0 && this.config.width > 0) {
            url.width = this.config.width;
        }

        // Need to be last because the other values could be used to build the URL
        if (isStringWithValue(url.name)) {
            // See if the name is a formatted name
            if (url.name.search('{' !== -1)) {
                url.filename = this.formatFileName(url, url.name);
                url.type = this.getFileTypeFromFilename(url);
            } else {
                url.filename = url.name;
                url.type = this.getFileTypeFromFilename(url);
            }
        } else {
            url.filename = this.formatFileName(url, this.config.nameFormat);
            url.type = this.getFileTypeFromFilename(url);
        }

        // Need to be last because the other values could be used to build the URL
        url.filename = this.getFilename(url);
        url.path = this.getPath(url);

        // Set the file type again in case the filename extension changes it
        url.type = this.getFileTypeFromFilename(url);

        return url;
    },

    /**
     * Gets the directory to save the screenshot in
     *
     * @param {object} url The URL object
     * @returns {string}
     */
    getDir(url) {
        let returnValue = this.config.processDir(url?.dir);
        if (returnValue.length === 0 && this.config.dir.length > 0) {
            returnValue = this.config.dir;
        }
        return returnValue;
    },

    /**
     * Gets the file name to save the screenshot as
     *
     * @param {string} url 
     * @returns {string}
     */
    getFilename(url) {
        let returnValue = '';
        if (isStringWithValue(url.name)) {
            if (url.name.search('{' !== -1)) {
                returnValue = this.formatFileName(url, url.name);
            } else {
                returnValue = url.name;
            }
        } else {
            // Use the config name format or name
            if (isStringWithValue(this.config.nameFormat)) {
                returnValue = this.formatFileName(url, this.config.nameFormat);
            } else if (isStringWithValue(this.config.fileName)) {
                returnValue = this.config.fileName;
            } else {
                // Fall back to getting the filename from the URL
                returnValue = this.formatFileName(url, '{url}');
            }
        }
        // Add the extension
        let ext = extname(returnValue).toLowerCase().replace('.', '');
        if (!isStringWithValue(ext)) {
            // The extension is not valid. Use the file type
            ext = this.getFileType(url);
            returnValue += `.${ext}`;
        }
        return returnValue;
    },

    /**
     * Gets the path to save the screenshot at
     *
     * @param {object} url The URL object
     * @returns string
     */
    getPath(url) {
        const dir = this.getDir(url);
        let filename = '';
        if (isStringWithValue(url.filename)) {
            filename = url.filename;
        } else {
            filename = this.getFilename(url);
        }
        return join(dir, filename);
    },

    /**
     * Gets the file type to use for the screenshot
     *
     * @param {object} url The URL object
     * @param {string} [type] A type value to test.
     * @returns {string} The file type
     */
    getFileType(url, type) {
        let typeValue = '';
        if (isStringWithValue(type)) {
            typeValue = this.config.validateFileType(type);
        } else {
            typeValue = this.config.validateFileType(url?.type);
        }
        if (!typeValue) {
            // The type is not valid. Use the config file type, which will will already be validated
            // and defaults to 'jpg' if the passed config file type is not valid.
            typeValue = this.config.fileType;
        }
        return typeValue;
    },

    /**
     * Gets the file type to use for the screenshot from the filename
     *
     * @param {object} url The URL object
     * @returns {string} The file type
     */
    getFileTypeFromFilename(url) {
        return this.getFileType(url, extname(url.filename).toLowerCase().replace('.', ''));
    },

    /**
     * Formats the file name by replacing placeholders with values
     * 
     * Supported placeholders:
     * {height} - The height of the screenshot. If full screen this height doesn't mean much unless the height of the page is less than this height.
     * {quality} - The JPG quality of the screenshot image
     * {url} - The URL the screenshot is for
     * {width} - The width of the screenshot
     * 
     * @param {object} url The URL object
     * @param {string} name The name format to use
     * @returns {string} The formatted file name
     */
    formatFileName(url, name) {
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

        // Get the URL stub
        let stub = url.url.replace(/http(s?):\/\//, '');
        const stubParts = stub.split('/');
        stub = stub.replace(stubParts[0], '').trim();
        if (stub === '/' || stub.length === 0) {
            stub = 'home';
        } else {
            if (stub.substring(0, 1) === '/') {
                stub = stub.substring(1);
            }
            stub = sanitize(stub, { replacement: '-' });
            stub = stub.replace(/\.+/g, '-');
            stub = stub.replace(/-{2,}/g, '-');
            if (stub.substring(stub.length - 1) === '-') {
                stub = stub.substring(0, stub.length - 1);
            }
            if (stub.substring(0, 1) === '-') {
                stub = stub.substring(1);
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

        // Set up the "size" portion of the name
        if (typeof url.sizeName === 'undefined' || (typeof url.sizeName !== 'string' || url.sizeName.length === 0)) {
            url.sizeName = `${url.width}x${url.height}`;
        }

        // Format the name
        name = name.replace(/{url}/g, urlName);
        name = name.replace(/{stub}/g, stub);
        name = name.replace(/{width}/g, url.width);
        name = name.replace(/{height}/g, url.height);
        name = name.replace(/{quality}/g, url.quality);
        name = name.replace(/{full}/g, full);
        name = name.replace(/{fit}/g, fit);
        name = name.replace(/{size}/g, url.sizeName);

        return name;
    }
}

export default screenshot;