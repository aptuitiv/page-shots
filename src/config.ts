/* ===========================================================================
    Configuration for the page-shots package
=========================================================================== */

import fs from 'fs-extra';
import { extname } from 'path';
import { type ImageFormat, type PuppeteerLifeCycleEvent } from 'puppeteer';

// Library
import { logError } from './lib/log.js';
import {
    objectValueIsNumberOrNumberString,
    objectValueIsStringWithValue,
} from './lib/object.js';
import {
    BoolLike,
    isBoolLike,
    isDefined,
    isNumberOrNumberString,
    isObjectWithValues,
    isStringWithValue,
    isTrueLike,
} from './lib/types.js';

import {
    type Clip,
    type Config,
    type ConfigParam,
    type SizeConfig,
    type SizeParam,
    type SizeParamObject,
    type UrlConfig,
    type UrlParam,
    type UrlParamObject,
} from './types.js';

// Default configuration
export const defaultConfig: Config = {
    // The base URL to prepend to each URL if necessary
    baseUrl: '',
    // Holds an object which specifies clipping region of the page.
    clip: false,
    // The number of milliseconds to delay after loading before taking a picture of the page
    delay: 0,
    // The device scale factor to use for the screenshot. Puppeteer default is 1.
    deviceScaleFactor: 1,
    // The directory that screenshots are saved in
    dir: '',
    // The file name to save the screenshots as.
    // This is only used if a specific file name is set in the configuration or the CLI arguments
    // and the name doesn't include {} placeholders.
    fileName: '',
    // The file type to save the screenshots as
    fileType: 'jpeg',
    // Holds whether or not the screenshot should be full page
    fullScreen: true,
    // Holds the viewport height to get the screenshot in
    height: 900,
    // The format to generate the file name from
    nameFormat: '{urlNoWww}-{width}',
    // The image quality if the screenshot is a jpg
    quality: 100,
    // The number of milliseconds to delay after each scroll to allow the content to load.
    // This is used to allow time for lazy loading of images or animations that are triggered by the scroll to complete.
    scrollDelay: 400,
    // Holds one or more viewport sizes to get the screenshot in
    sizes: [],
    // This determines the maximum pixel height of the screenshot that can be taken natively before falling back to stitching screenshots together. It's based on the maximum texture size supported by Chromium's software GL backend. Visit https://webglreport.com/ in Chrome and check the 'Max Texture Size' value to see the maximum texture size supported by the browser.
    stitchThreshold: 16000,
    // The list of URLs to get screenshots for
    urls: [],
    // The wait until value to use for the page
    waitUntil: 'load',
    // Holds the viewport width to get the screenshot in
    width: 1300,
};

// Maximum delay in milliseconds
export const maxDelay = 30000;

/**
 * Processes the height or width value
 *
 * @param {string|number} value The height or width value to process
 * @returns {number} The processed height or width value
 */
const processHeightWidth = (value: string | number): number => {
    let returnValue = 0;
    if (isNumberOrNumberString(value)) {
        const size = parseInt(value.toString(), 10);
        if (size > 0) {
            returnValue = size;
        }
    }
    return returnValue;
};

/**
 * Validates that the file type is allowed
 *
 * @param {string} type The file type
 * @returns {ImageFormat|boolean} The valid file type or false if the type is not valid
 */
const validateFileType = (type: string): ImageFormat | false => {
    let returnVal: ImageFormat | false = false;
    if (isStringWithValue(type)) {
        let fileType = type.toLowerCase().replace('.', '');
        if (['jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
            if (fileType === 'jpg') {
                fileType = 'jpeg';
            }
            returnVal = fileType as ImageFormat;
        }
    }
    return returnVal;
};

// Configuration object
export class ConfigParser {
    /**
     * Holds the configuration data.
     *
     * It defaults to the default configuration.
     * As each configuration param is processed, this will be updated with the new values.
     *
     * @type {Config}
     */
    config: Config;

    /**
     * Holds the configuration data being worked on.
     *
     * @type {ConfigParam}
     */
    configParam: ConfigParam;

    /**
     * Holds whether or not to process the configuration URL if it's included in the config data.
     *
     * @type {boolean}
     */
    processFile: boolean;

    /**
     * Holds whether or not to process the configuration sizes if it's included in the config data.
     *
     * @type {boolean}
     */
    processSizes: boolean;

    /**
     * Holds whether or not to process the configuration URLs if it's included in the config data.
     *
     * @type {boolean}
     */
    processUrls: boolean;

    /**
     * Constructor
     *
     * @param {Config|SizeConfig|UrlConfig} baseConfig The default configuration to use instead of the core default configuration
     */
    constructor(baseConfig?: Config | SizeConfig | UrlConfig) {
        this.config = { ...defaultConfig };
        if (isObjectWithValues(baseConfig)) {
            // A base configuration object was passed in. Use it to set the configuration.
            const baseConfigObject = { ...(baseConfig as Config) };
            // For consistency, make sure that the sizes and urls values are always arrays.
            if (!Array.isArray(baseConfigObject.sizes)) {
                baseConfigObject.sizes = [];
            }
            if (!Array.isArray(baseConfigObject.urls)) {
                baseConfigObject.urls = [];
            }
            this.config = baseConfigObject;
        }

        this.processFile = false;
        this.processSizes = true;
        this.processUrls = true;
    }

    /**
     * Set that the configuration file should be processed if it's included in the config data.
     */
    setProcessConfigFile() {
        this.processFile = true;
    }

    /**
     * Set that the configuration sizes should be processed if it's included in the config data.
     */
    setDoNotProcessSizes() {
        this.processSizes = false;
    }

    /**
     * Set that the configuration URLs should be processed if it's included in the config data.
     */
    setDoNotProcessUrls() {
        this.processUrls = false;
    }

    /**
     * Parse the configuration data
     *
     * @param {ConfigParam} data The configuration data to parse
     */
    parse(data: ConfigParam) {
        if (isObjectWithValues(data)) {
            // If the configuration file is set in the configuration data
            // and the processConfigFile flag is set, parse the configuration file first.
            if (this.setProcessConfigFile && isStringWithValue(data?.config)) {
                this.#parseFile(data.config);
            }

            // Parse the configuration data
            this.#parseConfig(data);
        }
    }

    /**
     * Parse the JSON config file and merge it with the current config
     *
     * @param {string} file The name of the JSON config file to parse
     */
    #parseFile(file: string) {
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
                this.#parseConfig(fs.readJsonSync(configFile));
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
    }

    /**
     * Parse the configuration data
     *
     * @param {ConfigParam} data The configuration data to parse
     */
    #parseConfig(data: ConfigParam) {
        this.configParam = data;
        this.#setBaseUrl();
        this.#setClip();
        this.#setDelay();
        this.#setDeviceScaleFactor();
        this.#setDir();
        this.#setFileName();
        this.#setFileType();
        this.#setFullScreen();
        this.#setHeight();
        this.#setHideStitchElement();
        this.#setQuality();
        this.#setScrollDelay();
        this.#setStitchThreshold();
        if (this.processUrls) {
            this.#setUrls();
        }
        if (this.processSizes) {
            this.#setViewportSizes();
        }
        this.#setWaitUntil();
        this.#setWidth();
    }

    /**
     * Get the configuration
     *
     * @returns {Config} The configuration
     */
    getConfig(): Config {
        return this.config;
    }

    /**
     * Checks if the configuration has URLs
     *
     * @returns {boolean}
     */
    hasUrls(): boolean {
        return this.config.urls.length > 0;
    }

    /**
     * Set the base URL value
     *
     * Remove the trailing slash from the base URL if it exists
     */
    #setBaseUrl() {
        if (isStringWithValue(this.configParam?.base)) {
            this.config.baseUrl = this.configParam.base.replace(/\/$/, '');
        } else if (isStringWithValue(this.configParam?.baseUrl)) {
            this.config.baseUrl = this.configParam.baseUrl.replace(/\/$/, '');
        }
    }

    /**
     * Set the clip data
     */
    #setClip() {
        if (isObjectWithValues<Clip>(this.configParam?.clip)) {
            if (
                objectValueIsNumberOrNumberString(this.configParam.clip, 'x') &&
                objectValueIsNumberOrNumberString(this.configParam.clip, 'y') &&
                objectValueIsNumberOrNumberString(this.configParam.clip, 'w') &&
                objectValueIsNumberOrNumberString(this.configParam.clip, 'h')
            ) {
                const x = parseInt(this.configParam.clip.x.toString(), 10);
                const y = parseInt(this.configParam.clip.y.toString(), 10);
                const w = parseInt(this.configParam.clip.w.toString(), 10);
                const h = parseInt(this.configParam.clip.h.toString(), 10);
                if (x >= 0 && y >= 0 && w > 0 && h > 0) {
                    this.config.clip = {
                        x,
                        y,
                        width: w,
                        height: h,
                    };
                }
            }
        } else if (
            isNumberOrNumberString(this.configParam?.clipWidth) &&
            isNumberOrNumberString(this.configParam?.clipHeight)
        ) {
            const clipX = isNumberOrNumberString(this.configParam?.clipX)
                ? this.configParam.clipX
                : 0;
            const clipY = isNumberOrNumberString(this.configParam?.clipY)
                ? this.configParam.clipY
                : 0;
            const x = parseInt(clipX.toString(), 10);
            const y = parseInt(clipY.toString(), 10);
            const w = parseInt(this.configParam.clipWidth.toString(), 10);
            const h = parseInt(this.configParam.clipHeight.toString(), 10);
            if (x >= 0 && y >= 0 && w > 0 && h > 0) {
                this.config.clip = { x, y, width: w, height: h };
            }
        }
    }

    /**
     * Set the delay value
     *
     */
    #setDelay() {
        if (isNumberOrNumberString(this.configParam?.delay)) {
            let delay = parseInt(this.configParam.delay.toString(), 10);
            if (delay > 0) {
                if (delay > maxDelay) {
                    delay = maxDelay;
                }
                this.config.delay = delay;
            }
        }
    }

    /**
     * Set the directory value
     *
     */
    #setDir() {
        if (isStringWithValue(this.configParam?.dir)) {
            this.config.dir = this.configParam.dir.replace(/\/$/, '');
        }
    }

    /**
     * Sets the file name for the first URL or the name pattern to use for all URLs
     *
     */
    #setFileName() {
        if (isStringWithValue(this.configParam?.name)) {
            if (this.configParam.name.includes('{')) {
                /**
                 * The name includes placeholders and it's a pattern for all URLs.
                 * Set it as the new name format
                 */
                this.config.nameFormat = this.configParam.name;
            } else {
                // The file name is an explicit file name.
                // Set the file type and file name
                const fileType = validateFileType(
                    extname(this.configParam.name)
                );
                this.config.fileName = this.configParam.name;
                if (fileType) {
                    this.config.fileType = fileType;
                }
            }
        }
    }

    /**
     * Set the file type to save the screenshots as
     *
     */
    #setFileType() {
        if (isStringWithValue(this.configParam?.type)) {
            const fileType = validateFileType(this.configParam.type);
            if (fileType) {
                this.config.fileType = fileType;
            }
        }
        if (isTrueLike(this.configParam?.jpg)) {
            this.config.fileType = 'jpeg';
        }
        if (isTrueLike(this.configParam?.png)) {
            this.config.fileType = 'png';
        }
        if (isTrueLike(this.configParam?.webp)) {
            this.config.fileType = 'webp';
        }
    }

    /**
     * Sets whether or not to get a full page screenshot
     *
     */
    #setFullScreen() {
        if (
            isBoolLike(this.configParam?.fit) ||
            isBoolLike(this.configParam?.fullscreen) ||
            isBoolLike(this.configParam?.fullScreen) ||
            isBoolLike(this.configParam?.full)
        ) {
            let fullScreen: BoolLike = true;
            if (isBoolLike(this.configParam?.fit)) {
                fullScreen = this.configParam.fit;
            } else if (isBoolLike(this.configParam?.fullscreen)) {
                fullScreen = this.configParam.fullscreen;
            } else if (isBoolLike(this.configParam?.fullScreen)) {
                fullScreen = this.configParam.fullScreen;
            } else if (isBoolLike(this.configParam?.full)) {
                fullScreen = this.configParam.full;
            }
            if (isTrueLike(fullScreen)) {
                this.config.fullScreen = true;
            } else {
                this.config.fullScreen = false;
            }
        }
    }

    /**
     * Sets the height of the viewport to take the screenshot in
     */
    #setHeight() {
        const height = processHeightWidth(this.configParam?.height);
        if (height > 0) {
            this.config.height = height;
        }
    }

    /**
     * Sets the CSS selector of the element to hide during the screenshot process if screenshots are stitched together. The elements are hidden after the first scroll. Common usage is to hide a sticky header or floating element.
     */
    #setHideStitchElement() {
        if (isStringWithValue(this.configParam?.hideStitchSelector)) {
            this.config.hideStitchSelector = [
                this.configParam.hideStitchSelector,
            ];
        } else if (Array.isArray(this.configParam.hideStitchSelector)) {
            this.config.hideStitchSelector = [];
            this.configParam.hideStitchSelector.forEach(
                (hideStitchSelector) => {
                    if (isStringWithValue(hideStitchSelector)) {
                        this.config.hideStitchSelector.push(hideStitchSelector);
                    }
                }
            );
        }
    }

    /**
     * Sets the device scale factor to use for the screenshot.
     */
    #setDeviceScaleFactor() {
        if (isNumberOrNumberString(this.configParam?.pixelRatio)) {
            const deviceScaleFactor = parseInt(
                this.configParam.pixelRatio.toString(),
                10
            );
            if (deviceScaleFactor > 0) {
                this.config.deviceScaleFactor = deviceScaleFactor;
            }
        }
    }

    /**
     * Sets the quality to save jpg images as
     */
    #setQuality() {
        if (isNumberOrNumberString(this.configParam?.quality)) {
            const quality = parseInt(this.configParam.quality.toString(), 10);
            if (quality > 0 && quality <= 100) {
                this.config.quality = quality;
            }
        }
    }

    /**
     * Sets the number of milliseconds to delay after each scroll to allow the content to load.
     *
     * This is used to allow time for lazy loading of images or animations that are triggered by the scroll to complete.
     */
    #setScrollDelay() {
        if (isNumberOrNumberString(this.configParam?.scrollDelay)) {
            const scrollDelay = parseInt(
                this.configParam.scrollDelay.toString(),
                10
            );
            if (scrollDelay > 0) {
                this.config.scrollDelay = scrollDelay;
            }
        }
    }

    /**
     * Sets the stitch threshold value
     */
    #setStitchThreshold() {
        const stitchThreshold = processHeightWidth(
            this.configParam?.stitchThreshold
        );
        if (stitchThreshold > 0) {
            this.config.stitchThreshold = stitchThreshold;
        }
    }

    /**
     * Sets one or more URLs
     */
    #setUrls() {
        if (
            Array.isArray(this.configParam?.urls) &&
            this.configParam.urls.length > 0
        ) {
            for (const url of this.configParam.urls) {
                this.#configureUrl(url);
            }
        } else if (isStringWithValue(this.configParam?.urls)) {
            this.#configureUrl(this.configParam.urls);
        } else if (
            Array.isArray(this.configParam?.url) &&
            this.configParam.url.length > 0
        ) {
            for (const url of this.configParam.url) {
                this.#configureUrl(url);
            }
        } else if (isStringWithValue(this.configParam?.url)) {
            this.#configureUrl(this.configParam.url);
        }
    }

    /**
     * Configures the URL object
     *
     * If the URL is a string, it will be converted to an object with the type and URL properties.
     * If the URL is an object, it will be returned as is.
     *
     * If the URL is an object and the name is not set, the file name will be used.
     * If the URL is an object and the type is not set, the file type will be used.
     *
     * @param {UrlParam} url The URL to configure
     */
    #configureUrl(url: UrlParam) {
        if (
            isObjectWithValues<UrlParamObject>(url) &&
            objectValueIsStringWithValue(url, 'url')
        ) {
            this.config.urls.push(url);
        } else if (isStringWithValue(url)) {
            this.config.urls.push({ url });
        }
    }

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
     * It can also be set as an object that contains the width and height values and other configuration values.
     * {width: 1200, height: 560}
     */
    #setViewportSizes() {
        if (isDefined(this.configParam?.sizes)) {
            this.#processViewportSizes(this.configParam.sizes);
        } else if (isDefined(this.configParam?.size)) {
            this.#processViewportSizes(this.configParam.size);
        }
    }

    /**
     * Processes the viewport sizes
     *
     * @param {SizeParam} sizes The viewport size(s) to process
     */
    #processViewportSizes(sizes: SizeParam) {
        if (isStringWithValue(sizes)) {
            this.#configureViewportSize(sizes);
        } else if (Array.isArray(sizes)) {
            for (const size of sizes) {
                this.#configureViewportSize(size);
            }
        } else if (isObjectWithValues(sizes)) {
            this.#configureViewportSize(sizes);
        }
    }

    /**
     * Configures a viewport size
     *
     * @param {string|SizeParamObject} size The viewport size to configure
     */
    #configureViewportSize(size: string | SizeParamObject) {
        if (isStringWithValue(size)) {
            const sizes = size.split('x');
            if (sizes.length === 2) {
                const width = parseInt(sizes[0], 10);
                const height = parseInt(sizes[1], 10);
                if (width > 0 && height > 0) {
                    this.config.sizes.push({
                        height,
                        width,
                    });
                }
            }
        } else if (
            objectValueIsNumberOrNumberString(size, 'width') &&
            objectValueIsNumberOrNumberString(size, 'height')
        ) {
            const width = parseInt(size.width.toString(), 10);
            const height = parseInt(size.height.toString(), 10);
            if (width > 0 && height > 0) {
                this.config.sizes.push(size);
            }
        }
    }

    /**
     * Sets the wait until value to use for the page
     *
     * https://www.browserstack.com/guide/puppeteer-waituntil
     * https://pptr.dev/api/puppeteer.puppeteerlifecycleevent
     * https://screenshotone.com/blog/puppeteer-wait-until-the-page-is-ready/
     */
    #setWaitUntil() {
        if (isStringWithValue(this.configParam?.waitUntil)) {
            const waitUntil = this.configParam.waitUntil.toLowerCase();
            if (
                [
                    'domcontentloaded',
                    'load',
                    'networkidle0',
                    'networkidle2',
                ].includes(waitUntil)
            ) {
                this.config.waitUntil = waitUntil as PuppeteerLifeCycleEvent;
            }
        }
    }

    /**
     * Sets the width of the viewport to take the screenshot in
     */
    #setWidth() {
        const width = processHeightWidth(this.configParam?.width);
        if (width > 0) {
            this.config.width = width;
        }
    }
}
