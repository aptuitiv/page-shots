/* ===========================================================================
    Configuration for the page-shots package
=========================================================================== */

import fs from 'fs-extra';
import { extname } from 'path';

// Library
import { logError } from './lib/log.js';
import { objectValueIsNumberOrNumberString, objectValueIsStringWithValue } from './lib/object.js';
import { isBoolLike, isDefined, isNumberOrNumberString, isObjectWithValues, isStringWithValue, isTrueLike } from './lib/types.js';

const config = {
    // The base URL to prepend to each URL if necessary
    baseUrl: '',
    // Holds an object which specifies clipping region of the page.
    clip: false,
    // The number of milliseconds to delay after loading before taking a picture of the page
    delay: 0,
    // The directory that screenshots are saved in
    dir: '',
    // The file name to save the screenshots as.
    // This is only used if a specific file name is set in the configuration or the CLI arguments
    // and the name doesn't include {} placeholders.
    fileName: '',
    // The file type to save the screenshots as
    fileType: 'jpg',
    // Holds whether or not the screenshot should be full page
    fullScreen: true,
    // Holds the viewport height to get the screenshot in
    height: 900,
    // Maximum delay in milliseconds
    maxDelay: 30000,
    // The format to generate the file name from
    nameFormat: '{url}-{width}',
    // The image quality if the screenshot is a jpg
    quality: 100,
    // Holds one or more viewport sizes to get the screenshot in
    sizes: [],
    // The list of URLs to get screenshots for
    urls: [],
    // Holds the viewport width to get the screenshot in
    width: 1300,


    /**
     * Set the base URL
     * 
     * @param {string} url The base URL to prepend to each URL if necessary
     */
    setBaseUrl(url) {
        if (isStringWithValue(url)) {
            // Remove the trailing slash if it exists
            this.baseUrl = url.replace(/\/$/, '');
        }
    },

    /**
     * Set the clip object
     *
     * @param {object} clip The clip object to set
     */
    setClip(clip) {
        this.clip = this.processClip(clip);
    },

    /**
     * Processes the clip object
     *
     * @param {object} clip The clip object to process
     * @returns {object|boolean} The processed clip object or false if the clip is not valid
     */
    processClip(clip) {
        let returnValue = false;
        if (
            objectValueIsNumberOrNumberString(clip, 'x') &&
            objectValueIsNumberOrNumberString(clip, 'y') &&
            objectValueIsNumberOrNumberString(clip, 'w') &&
            objectValueIsNumberOrNumberString(clip, 'h')
        ) {
            const x = parseInt(clip.x, 10);
            const y = parseInt(clip.y, 10);
            const w = parseInt(clip.w, 10);
            const h = parseInt(clip.h, 10);
            if (x >= 0 && y >= 0 && w > 0 && h > 0) {
                returnValue = {
                    x,
                    y,
                    width: w,
                    height: h
                }
            }
        }
        return returnValue;
    },

    /**
     * Sets the number of milliseconds to delay after loading a page before taking a screenshot
     *
     * @param {number} value The number of milliseconds to delay
     */
    setDelay(value) {
        const delay = this.processDelay(value);
    },

    /**
     * Processes the delay value
     * 
     * @param {number} value The number of milliseconds to delay
     * @returns {number} The processed delay value
     */
    processDelay(value) {
        let returnValue = 0;
        if (isNumberOrNumberString(value)) {
            const delay = parseInt(value, 10);
            if (delay > 0) {
                if (delay > this.maxDelay) {
                    delay = this.maxDelay;
                }
                returnValue = delay;
            }
        }
        return returnValue;
    },

    /**
     * Set the directory to save the screenshots to
     *
     * @param {string} dir The directory to set
     */
    setDir(dir) {
        this.dir = this.processDir(dir);
    },

    /**
     * Processes the directory value
     *
     * @param {string} dir The directory value to process
     * @returns {string} The processed directory value
     */
    processDir(dir) {
        let returnValue = '';
        if (isStringWithValue(dir)) {
            returnValue = dir.replace(/\/$/, '');
        }
        return returnValue;
    },

    /**
     * Set the file type to save the screenshots as
     *
     * @param {string} type The file type to save the screenshots as
     */
    setFileType(type) {
        const fileType = this.validateFileType(type);
        if (fileType) {
            this.fileType = fileType;
        }
    },

    /**
     * Sets whether or not to get a full page screenshot
     *
     * @param {string|boolean} value The full screen value to set
     */
    setFullScreen(value) {
        if (isTrueLike(value)) {
            this.fullScreen = true;
        } else {
            this.fullScreen = false;
        }
    },

    /**
     * Sets the height of the viewport to take the screenshot in
     *
     * @param {number} value The height value to set
     */
    setHeight(value) {
        const height = this.processHeightWidth(value);
        if (height > 0) {
            this.height = height;
        }
    },

    /**
     * Processes the height or width value
     *
     * @param {number} value The height or width value to process
     * @returns {number} The processed height or width value
     */
    processHeightWidth(value) {
        let returnValue = 0;
        if (isNumberOrNumberString(value)) {
            const size = parseInt(value, 10);
            if (size > 0) {
                returnValue = size;
            }
        }
        return returnValue;
    },

    /**
     * Sets the file name for the first URL or the name pattern to use for all URLs
     *
     * @param {string} name The file name
     */
    setFileName(name) {
        if (isStringWithValue(name)) {
            if (name.includes('{')) {
                /**
                 * The name includes placeholders and it's a pattern for all URLs. 
                 * Set it as the new name format
                 */
                this.nameFormat = name;
            } else {
                // The file name is an explicit file name.
                // Set the file type and file name
                const fileType = this.validateFileType(extname(name));
                this.fileName = name;
                if (fileType) {
                    this.fileType = fileType;
                }
            }
        }
    },

    /**
     * Sets the quality to save jpg images as
     *
     * @param {number} value The quality value to set
     */
    setQuality(value) {
        this.quality = this.processQuality(value);
    },

    /**
     * Processes the quality value
     *
     * @param {number} value The quality value to process
     * @returns {number} The processed quality value
     */
    processQuality(value) {
        let returnValue = 100;
        if (isNumberOrNumberString(value)) {
            const quality = parseInt(value, 10);
            if (quality > 0 && quality <= 100) {
                returnValue = quality;
            }
        }
        return returnValue;
    },

    /**
     * Sets one or more URLs
     * 
     * @param {Array | string} urls The URL(s) to set
     */
    setUrls(urls) {
        // Reset the URLs array
        this.urls = [];
        if (Array.isArray(urls)) {
            for (const url of urls) {
                const configuredUrl = this.configureUrl(url);
                if (isObjectWithValues(configuredUrl)) {
                    this.urls.push(configuredUrl);
                }
            }
        } else if (isStringWithValue(urls)) {
            const configuredUrl = this.configureUrl(urls);
            if (isObjectWithValues(configuredUrl)) {
                this.urls.push(configuredUrl);
            }
        }
    },

    /**
     * Configures the URL object
     * 
     * If the URL is a string, it will be converted to an object with the type and URL properties.
     * If the URL is an object, it will be returned as is.
     * 
     * If the URL is an object and the name is not set, the file name will be used.
     * If the URL is an object and the type is not set, the file type will be used.
     * 
     * @param {string|object} url The URL to configure
     * @returns {object|boolean} The URL object or false if the URL is not valid
     */
    configureUrl(url) {
        let returnValue = false;
        if (isObjectWithValues(url) && objectValueIsStringWithValue(url, 'url')) {
            returnValue = url;
        } else if (isStringWithValue(url)) {
            returnValue = {
                url,
            };
        }
        return returnValue;
    },

    /**
     * Set one or more viewport sizes
     * 
     * Each size can be set from a string where the width and height are separated by an "x".
     * 1200x560
     * 
     * It can be set as an array of sizes
     * ['1200x560', '600x400']
     * [{width: 1200, height: 560}, {width: 600, height: 400}]
     * 
     * It can also be set as an object that contains the width and height values.
     * {width: 1200, height: 560}
     * 
     * @param {string|Array|object} sizes The viewport size(s) to set
     */
    setViewportSizes(sizes) {
        this.sizes = this.processViewportSizes(sizes);
    },

    /**
     * Processes the viewport sizes
     *
     * @param {string|Array|object} sizes The viewport size(s) to process
     * @returns {Array} The processed viewport sizes
     */
    processViewportSizes(sizes) {
        const returnValue = [];
        if (isStringWithValue(sizes)) {
            const configuredSize = this.configureViewportSize(sizes);
            if (isObjectWithValues(configuredSize)) {
                returnValue.push(configuredSize);
            }
        } else if (Array.isArray(sizes)) {
            for (const size of sizes) {
                const configuredSize = this.configureViewportSize(size);
                if (isObjectWithValues(configuredSize)) {
                    returnValue.push(configuredSize);
                }
            }
        } else if (isObjectWithValues(sizes)) {
            const configuredSize = this.configureViewportSize(sizes);
            if (isObjectWithValues(configuredSize)) {
                returnValue.push(configuredSize);
            }
        }
        return returnValue;
    },

    /**
     * Configures a viewport size
     * 
     * @param {string|object} size The viewport size to configure
     * @returns {object|boolean} The configured viewport size or false if the size is not valid
     */
    configureViewportSize(size) {
        let returnValue = false;
        if (isStringWithValue(size)) {
            const sizes = size.split('x');
            if (sizes.length === 2) {
                const width = parseInt(sizes[0], 10);
                const height = parseInt(sizes[1], 10);
                if (width > 0 && height > 0) {
                    returnValue = { width, height };
                }
            }
        } else if (objectValueIsNumberOrNumberString(size, 'width') && objectValueIsNumberOrNumberString(size, 'height')) {
            const width = parseInt(size.width, 10);
            const height = parseInt(size.height, 10);
            if (width > 0 && height > 0) {
                returnValue = { width, height };
            }
        }
        return returnValue;
    },

    /**
     * Sets the width of the viewport to take the screenshot in
     *
     * @param {number} value The width value to set
     */
    setWidth(value) {
        const width = this.processHeightWidth(value);
        if (width > 0) {
            this.width = width;
        }
    },

    /**
     * Parse the configuration data
     *
     * @param {object} data The configuration data to parse
     */
    parseConfig(data) {
        if (isObjectWithValues(data)) {
            this.setBaseUrl(data?.baseUrl);
            this.setClip(data?.clip);
            this.setDelay(data?.delay);
            this.setDir(data?.dir);
            this.setFileName(data?.name);
            this.setFileType(data?.type);
            this.setFullScreen(this.processFitAndFullScreen(data));
            this.setHeight(data?.height);
            this.setQuality(data?.quality);
            this.setViewportSizes(data?.sizes);
            if (isDefined(data.url)) {
                this.setUrls(data.url);
            } else if (isDefined(data.urls)) {
                this.setUrls(data.urls);
            }
            this.setWidth(data?.width);
        }
    },

    /**
     * Processes the fit and full screen values
     *
     * @param {object} data The data to process
     * @returns {boolean|null} The processed fit and full screen values or null if the values are not valid
     */
    processFitAndFullScreen(data) {
        let returnValue = null;
        let fullScreen = true;
        if (isBoolLike(data?.fit)) {
            fullScreen = data.fit;
        } else if (isBoolLike(data?.fullScreen)) {
            fullScreen = data.fullScreen;
        } else if (isBoolLike(data?.full)) {
            fullScreen = data.full;
        } else if (isBoolLike(data.fullscreen)) {
            fullScreen = data.fullscreen;
        }
        if (isTrueLike(fullScreen)) {
            returnValue = true;
        } else {
            returnValue = false;
        }
        return returnValue;
    },

    /**
     * Parse the JSON config file and merge it with the current config
     *
     * @param {string} file The name of the JSON config file to parse
     */
    parseConfigFile(file) {
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
                this.parseConfig(fs.readJsonSync(configFile));

            } else {
                logError(`The JSON config file "${configFile}" could not be found`);
                process.exit();
            }
        } catch (err) {
            logError(`Error while processing the JSON config file ${file}`, err);
            process.exit();
        }
    },

    /**
     * Validates that the file type is allowed
     *
     * @param {string} type The file type
     * @returns {string|boolean} The valid file type or false if the type is not valid
     */
    validateFileType(type) {
        let returnVal = false;
        if (isStringWithValue(type)) {
            let fileType = type.toLowerCase().replace('.', '');
            if (['jpg', 'jpeg', 'png'].includes(fileType)) {
                if (fileType === 'jpeg') {
                    fileType = 'jpg';
                }
                returnVal = fileType;
            }
        }
        return returnVal;
    }
};

export default config;