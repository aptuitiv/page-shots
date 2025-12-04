/**
 * Main file to process the screenshot
 */
import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { extname, dirname, join } from 'path';
import chalk from 'chalk';
import sanitize from 'sanitize-filename';
import ora from 'ora';

/**
 * Sleeps the program
 * @link https://flaviocopes.com/javascript-sleep/
 * @param {Number} milliseconds 
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

/**
 * Main class to run and process the screenshots
 */
class PageShots {
    /**
     * Constructor
     */
    constructor() {
        // Maximum delay in milliseconds
        this.maxDelay = 30000;
        // The base URL to prepend to each URL if necessary
        this.baseUrl = '';
        // The directory that screenshots are saved in
        this.dir = '';
        // Holds the format to generate the file name from
        this.nameFormat = '{url}-{width}';
        // The list of URLs to get screenshots for
        this.urls = [];
        // The name and extension for the first URL. Used if setting a name but a URL hasn't been set yet
        this.firstUrlName = false;
        this.firstUrlType = false;
        // The time that the script started running
        this.startTime = process.hrtime();
        // Holds the time for when a page started
        this.pageStartTime = 0;
        // The file type to save the screenshots as
        this.fileType = 'jpg';
        // Holds the image quality if the screenshot is a jpg
        this.quality = 100;
        // The number of milliseconds to delay after loading before taking a picture of the page
        this.delay = 0;
        // Spinners
        this.pageSpinner = null;
        this.shotSpinner = null;
        this.delaySpinner = null;
        this.scrollSpinner = null;
        // Holds the viewport width to get the screenshot in
        this.width = 1300;
        // Holds the viewport height to get the screenshot in
        this.height = 900;
        // Holds one or more viewport sizes to get the screenshot in
        this.sizes = [];
        // Holds whether or not the screenshot should be full page
        this.fullScreen = true;
        // Holds an object which specifies clipping region of the page.
        this.clip = false;
        // Holds the browser object
        this.browser = null;
        // Holds the page object
        this.page = null;
    }

    /**
     * Initialize the browser and page objects
     */
    async init() {
        let _self = this;
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();

        this.page.on('load', function () {
            _self.pageSpinner.succeed(green(this.url() + ' loaded in ' + _self._getPageElapsedTime()));
        });
    }

    /**
     * Sets the configuration in a JSON object
     * @param {object} json 
     */
    setConfigJson(json) {
        if (json !== false && typeof json === 'object') {
            this.setBaseUrl(json.baseUrl);
            this.setDir(json.dir);
            this.setFileType(json.type);
            this.addUrl(json.urls);
            this.addSize(json.sizes);
            this.setWidth(json.width);
            this.setHeight(json.height);
            this.setDelay(json.delay);
            if (typeof json.fit !== 'undefined') {
                if (json.fit === 'y' || json.fit === 'yes' || json.fit === true || json.fit === 'true') {
                    this.setFullScreen(false);
                }
            } else if (typeof json.fullScreen !== 'undefined') {
                if (json.fullScreen !== 'y' && json.fullScreen !== 'yes' && json.fullScreen !== true && json.fullScreen !== 'true') {
                    this.setFullScreen(false);
                }
            }
            this.setName(json.name);
            this.setQuality(json.quality);
            if (typeof json.clip !== 'undefined'
                && typeof json.clip.x !== 'undefined'
                && typeof json.clip.y !== 'undefined'
                && typeof json.clip.w !== 'undefined'
                && typeof json.clip.h !== 'undefined'
            ) {
                this.setClip(json.clip.x, json.clip.y, json.clip.w, json.clip.h);
            }
        }
    }

    /**
     * Sets the base URL.
     * This is not required, but if it's set, then the base URL will be
     * prepended to all other URLs
     * @param {string} url The base URL
     */
    setBaseUrl(url) {
        if (typeof url === 'string' && url.length > 1) {
            if (url.substring(url.length - 1) == '/') {
                url = url.substring(0, url.length - 1);
            }
            this.baseUrl = url.trim();
        }
    }

    /**
     * Set the directory to output the screenshots to
     * @param {string} dir The directory relative to where the script is run to output the screenshots to
     */
    setDir(dir) {
        if (typeof dir === 'string' && dir.length > 0) {
            this.dir = dir.trim();
        }
    }

    /**
     * Sets the file type to save screenshots as
     * @param {string} type The file type to save screenshots as
     */
    setFileType(type) {
        type = this._validateType(type);
        if (type) {
            this.fileType = type;
        }
    }

    /**
     * Validates that the file type is allowed
     * @param {string} type The file type
     * @return {string|boolean} The valid file type or false if the type is not valid
     */
    _validateType(type) {
        let returnVal = false;
        if (typeof type === 'string' && type.length > 0) {
            type = type.toLowerCase();
            if (type === 'jpg' || type == 'jpeg' || type === 'png') {
                if (type == 'jpeg') {
                    type = 'jpg';
                }
                returnVal = type;
            }
        }
        return returnVal;
    }

    /**
     * Adds a URL to get a screenshot for
     * @param {string|Array|object} url 
     */
    addUrl(url) {
        if (Array.isArray(url)) {
            for (let u of url) {
                this._addUrl(u);
            }
        } else {
            this._addUrl(url);
        }
    }

    /**
     * Adds a URL to get a screenshot for
     * @param {string|object} url 
     */
    _addUrl(url) {
        if (typeof url === 'string') {
            if (url.length > 0) {
                this.urls.push(this._setupFirstUrl({ url: url }));
            }
        } else if (typeof url === 'object' && typeof url.url !== 'undefined') {
            this.urls.push(this._setupFirstUrl(url));
        }
    }

    /**
     * Sets up the URL object for the first URL
     * 
     * It's possible that a name has been set before the URL was set so this will apply that to
     * the URL object if the URL being added is the first URL.
     * 
     * @param {object} url The URL object
     */
    _setupFirstUrl(url) {
        if (this.urls.length == 0) {
            if (this.firstUrlName) {
                url.name = this.firstUrlName;
                if (this.firstUrlType) {
                    url.ext = this.firstUrlType;
                }
            }
        }
        return url;
    }

    /**
     * Adds a viewport size 
     * 
     * It can be set from a string where the width and height are separated by an "x".
     * 1200x560
     * 
     * It can be set as an array of sizes
     * ['1200x560', '600x400']
     * [{width: 1200, height: 560}, {width: 600, height: 400}]
     * 
     * It can also be set as an object that contains the width and height values.
     * {width: 1200, height: 560}
     * 
     * @param {string|Array|object} size The viewport size to add
     */
    addSize(size) {
        let height = 0,
            width = 0;
        if (typeof size === 'string') {
            let sizes = size.split('x');
            if (sizes.length == 2) {
                width = parseInt(sizes[0]);
                height = parseInt(sizes[1]);
                if (height > 0 && width > 0) {
                    this.sizes.push({ width: width, height: height });
                }
            }
        } else if (Array.isArray(size) && size.length > 0) {
            for (let s of size) {
                this.addSize(s);
            }
        } else if (typeof size === 'object' && typeof size.width !== 'undefined' && typeof size.height !== 'undefined') {
            size.width = parseInt(size.width);
            size.height = parseInt(size.height);
            if (size.width > 0 && size.height > 0) {
                this.sizes.push(size);
            }
        }
    }

    /**
     * Sets the width of the viewport to take the screenshot in
     * @param {integer} width 
     */
    setWidth(width) {
        width = parseInt(width);
        if (width > 0) {
            this.width = width;
        }
    }

    /**
     * Sets the height of the viewport to take the screenshot in
     * @param {integer} height 
     */
    setHeight(height) {
        height = parseInt(height);
        if (height > 0) {
            this.height = height;
        }
    }

    /**
     * Sets the number of milliseconds to delay after loading a page before taking a screenshot
     * @param {Number} delay The number of milliseconds to delay
     */
    setDelay(delay) {
        delay = parseInt(delay);
        if (delay > 0) {
            if (delay > this.maxDelay) {
                delay = this.maxDelay;
            }
            this.delay = delay;
        }
    }

    /**
     * Sets whether or not to get a full page screenshot
     * @param {string|boolean} full 
     */
    setFullScreen(full) {
        if (full === 'y' || full === 'yes' || full === true || full === 'true') {
            this.fullScreen = true;
        } else {
            this.fullScreen = false;
        }
    }

    /**
     * Sets the file name for the first URL or the name pattern to use for all URLs
     * @param {string} name The file name
     */
    setName(name) {
        if (typeof name === 'string' && name.length > 0) {
            if (name.search('{') !== -1) {
                /**
                 * The name includes placeholders and it's a pattern for all URLs. 
                 * Set it as the new name format
                 */
                this.nameFormat = name;
            } else {
                // Set it as the name for the first URL
                let ext = this._validateType(extname(name).toLowerCase().replace('.', ''));
                if (this.urls.length > 0) {
                    // At least one URL has been set. Set the name for the first URL
                    this.urls[0]['name'] = name;
                    if (ext) {
                        this.urls[0]['type'] = ext;
                    }
                } else {
                    // No URLs have been set yet. Set the name and extension for when the first URL is set later
                    this.firstUrlName = name;
                    this.firstUrlType = ext;
                }

            }
        }
    }

    /**
     * Sets the quality to save jpg images as
     * @param {integer} quality
     */
    setQuality(quality) {
        quality = parseInt(quality);
        if (quality > 0 && quality <= 100) {
            this.quality = quality;
        }
    }

    setClip(x, y, w, h) {
        x = parseInt(x);
        y = parseInt(y);
        w = parseInt(w);
        h = parseInt(h);
        if (x >= 0 && y >= 0 && w > 0 && h > 0) {
            this.clip = {
                x: x,
                y: y,
                width: w,
                height: h
            }
        }
    }

    /**
     * Get the screenshots of all of the URLs
     */
    async run() {
        var delay,
            dir,
            fullScreen,
            name,
            quality,
            size,
            type,
            typeTemp;
        try {
            console.log('');
            if (this.urls.length > 0) {
                for (let url of this.urls) {
                    this.pageStartTime = process.hrtime();
                    url = this._setupUrl(url);
                    this.pageSpinner = ora({ text: 'Loading ' + url.url, spinner: 'arc' }).start();
                    try {
                        await this.page.goto(url.url, { waitUntil: 'load' });
                    } catch (err) {
                        this.pageSpinner.fail(red('Could not load ' + url.url + '. ' + err));
                        console.log('');
                        continue;
                    }

                    // Get the screenshots
                    if (url.sizes.length > 0) {
                        delay = url.delay;
                        dir = url.dir;
                        fullScreen = url.fullScreen;
                        name = url.name;
                        quality = url.quality;
                        type = url.type;
                        for (size of url.sizes) {
                            url.width = size.width;
                            url.height = size.height;

                            // Override the delay if necessary
                            if (typeof size.delay !== 'undefined') {
                                size.delay = parseInt(size.delay);
                                if (size.delay > 0) {
                                    if (size.delay > this.maxDelay) {
                                        size.delay = this.maxDelay;
                                    }
                                    url.delay = size.delay;
                                } else {
                                    url.delay = delay;
                                }
                            } else {
                                url.delay = delay;
                            }

                            // Check to see if the size has a separate directory
                            if (typeof size.dir === 'string' && size.dir.length > 0) {
                                url.dir = size.dir;
                            } else {
                                url.dir = dir;
                            }

                            // Check to see if the size should be full screen
                            if (typeof size.full !== 'undefined' || typeof size.fit !== 'undefined') {
                                url.fullScreen = this._getFullScreen(size);
                            } else {
                                url.fullScreen = fullScreen;
                            }

                            if (typeof size.quality !== 'undefined') {
                                size.quality = parseInt(size.quality);
                                if (size.quality > 0 && size.quality <= 100) {
                                    url.quality = size.quality;
                                } else {
                                    url.quality = quality;
                                }
                            } else {
                                url.quality = quality;
                            }

                            // See if the size name was set
                            if (typeof size.key === 'string' && size.key.length > 0) {
                                url.sizeName = size.key;
                            } else {
                                url.sizeName = '';
                            }

                            // Override the name if necessary
                            if (typeof size.name === 'string' && size.name.length > 0) {
                                url.name = size.name;
                            } else {
                                url.name = name;
                            }

                            // Check the size is specifying a type
                            typeTemp = this._validateType(size.type);
                            if (typeTemp) {
                                url.type = typeTemp;
                            } else {
                                url.type = type;
                            }

                            // Regenerate the file name and path
                            url = this._regenerateFilename(url);

                            // Make sure that the directory exists
                            this._createDir(dirname(url.path));

                            // Take the screenshot
                            await this._screenshot(url);
                        }
                    } else {
                        // Make sure that the directory exists
                        this._createDir(dirname(url.path));

                        // Take the screenshot
                        await this._screenshot(url);
                    }

                    // Empty line after each URL run
                    console.log('');
                }
            } else {
                console.log(chalk.bgRed('Nothing to do. No URLs were set.'));
                console.log('');
            }

            await this.browser.close();

            if (this.urls.length > 0) {
                this._printElapsedTime();
            }
        } catch (err) {
            this._stopSpinners();
            await this.die();
            console.log(err);
            return null;
        }
    }

    /**
     * Stops any spinners
     */
    _stopSpinners() {
        if (this.pageSpinner !== null) {
            this.pageSpinner.stop();
        }
        if (this.shotSpinner !== null) {
            this.shotSpinner.stop();
        }
        if (this.delaySpinner !== null) {
            this.delaySpinner.stop();
        }
        if (this.scrollSpinner !== null) {
            this.scrollSpinner.stop();
        }
    }

    /**
     * Gets the screenshot of the image
     * 
     * Some code borrowed from @link https://www.screenshotbin.com/blog/handling-lazy-loaded-webpages-puppeteer
     * Some code borrowed from @link https://stackoverflow.com/a/49233383
     * @param {object} url The URL object
     */
    async _screenshot(url) {
        this.scrollSpinner = ora({ text: 'Scrolling page to try and force all content to load', spinner: 'arc' }).start();
        await this.page.setViewport(this._getViewportConfig(url));

        // Get the height of the rendered page
        const bodyHandle = await this.page.$('body');
        const { height } = await bodyHandle.boundingBox();
        await bodyHandle.dispose();

        // Scroll one viewport at a time, pausing to let content load
        const viewportHeight = this.page.viewport().height;
        let viewportIncr = 0;
        while (viewportIncr + viewportHeight < height) {
            await this.page.evaluate(_viewportHeight => {
                window.scrollBy(0, _viewportHeight);
            }, viewportHeight);
            await wait(20);
            viewportIncr = viewportIncr + viewportHeight;
        }

        // Scroll back to top
        await this.page.evaluate(_ => {
            window.scrollTo(0, 0);
        });

        // // Some extra delay to check and make sure that all images loaded
        let x = await this.page.evaluate(async () => {
            const selectors = Array.from(document.querySelectorAll("img"));
            let y = await Promise.all(selectors.map(img => {
                if (img.complete) return img;
                return new Promise((resolve, reject) => {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', reject);
                });
            }));
            return y;
        });

        // Some extra delay to let images load
        await wait(100);

        this.scrollSpinner.stop();

        // Sleep if necessary
        if (url.delay > 0) {
            this.delaySpinner = ora({ text: 'Delaying ' + url.delay + ' milliseconds', spinner: 'arc' }).start();
            await wait(url.delay);
            this.delaySpinner.succeed(green('Delayed ' + url.delay + ' milliseconds'));
        }

        // Save image screenshot
        try {
            this.shotSpinner = ora({ text: 'Starting ' + url.type + ' screenshot ' + url.path + ' (' + url.width + 'px / ' + url.height + 'px)', spinner: 'arc' }).start();
            await this.page.screenshot(this._getScreenshotConfig(url));
            this.shotSpinner.succeed(green('Saved ' + url.path + ' (' + url.width + 'px / ' + url.height + 'px)'));
        } catch (err) {
            if (this.shotSpinner !== null) {
                this.shotSpinner.stop();
            }
            console.log(red('Error while taking the screenshot'));
            console.log(red(err));
        }
    }

    /**
     * Kills everything in case of an error
     */
    async die() {
        this._stopSpinners();
        if (this.browser !== null) {
            await this.browser.close();
        }
    }

    /**
     * Creates the directory if it doesn't exist already
     */
    _createDir(dir) {
        if (dir.length > 0 && !existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Sets up the options for the URL
     * @param {object} url The URL object
     * @return {object}
     */
    _setupUrl(url) {
        url.baseUrl = this._getBaseUrl(url);

        // Set the URL to be made up of the baseURL and the URL value if necessary
        if (url.baseUrl.length > 0) {
            if (url.url.substring(0, url.baseUrl.length) !== url.baseUrl && url.url.match(/^http(s?):\/\//) === null) {
                if (url.url.substring(0, 1) !== '/') {
                    url.url = '/' + url.url;
                }
                url.url = url.baseUrl + url.url;
            }
        }

        if (url.url.match(/^http(s?):\/\//) === null) {
            // The URL does not start with "http" or "https"
            url.url = 'http://' + url.url;
        }

        url.clip = this._getClip(url);
        url.delay = this._getDelay(url);
        url.dir = this._getDir(url);
        url.fullScreen = this._getFullScreen(url);
        url.height = this._getHeight(url);
        url.quality = this._getQuality(url);
        url.sizes = this._getSizes(url);
        url.type = this._getType(url);
        url.width = this._getWidth(url);

        // Need to be last because the other values could be used to build the URL
        url.filename = this._getFilename(url);
        url.path = this._getPath(url);

        // Set the file type again in case the filename extension changes it
        let ext = this._validateType(extname(url.filename).toLowerCase().replace('.', ''));
        if (ext) {
            url.type = ext;
        }

        return url;
    }

    /**
     * Regenerates the URL filename and path
     * @param {object} url The URL object
     * @return {object} The updated URL object
     */
    _regenerateFilename(url) {
        delete url.filename;
        delete url.path;
        url.filename = this._getFilename(url);
        url.path = this._getPath(url);

        // Set the file type again in case the filename extension changes it
        let ext = this._validateType(extname(url.filename).toLowerCase().replace('.', ''));
        if (ext) {
            url.type = ext;
        }
        return url;
    }

    /**
     * Gets the base URL if available
     * @param {object} url The URL object
     * @return {string}
     */
    _getBaseUrl(url) {
        let baseUrl = this.baseUrl;
        if (typeof url.baseUrl === 'string' && url.baseUrl.length > 0) {
            baseUrl = url.baseUrl;
        }
        return baseUrl;
    }

    /**
     * Gets the screenshot clip object if available
     * @param {object} url The URL object
     * @return {object|boolean}
     */
    _getClip(url) {
        let clip = this.clip,
            x, y, w, h;
        if (
            typeof url.clip !== 'undefined'
            && typeof url.clip.x !== 'undefined'
            && typeof url.clip.y !== 'undefined'
            && typeof url.clip.width !== 'undefined'
            && typeof url.clip.height !== 'undefined'
        ) {
            x = parseInt(url.clip.x);
            y = parseInt(url.clip.y);
            w = parseInt(url.clip.width);
            h = parseInt(url.clip.height);
            if (x >= 0 && y >= 0 && w >= 0 && h >= 0) {
                clip = {
                    x: x,
                    y: y,
                    width: w,
                    height: h
                }
            }
        }
        return clip;
    }

    /**
     * Gets the number of milliseconds to delay after loading the URL before taking a screenshot
     * @param {object} url The URL object
     * @return {Number}
     */
    _getDelay(url) {
        let delay = this.delay,
            temp;
        if (typeof url.delay !== 'undefined') {
            temp = parseInt(url.delay);
            if (temp > 0) {
                if (temp > this.maxDelay) {
                    temp = this.maxDelay;
                }
                delay = temp;
            }
        }
        return delay;
    }

    /**
     * Gets the directory to save the screenshot in
     * @param {object} url The URL object
     * @return {string}
     */
    _getDir(url) {
        let dir = this.dir;
        if (typeof url.dir === 'string' && url.dir.length > 0) {
            dir = url.dir;
        }
        return dir;
    }

    /**
     * Gets the file name to save the screenshot as
     * @param {string} url 
     * @returns {string}
     */
    _getFilename(url) {
        let filename = '',
            type = this._getType(url),
            ext,
            setExt = true;

        if (typeof url.name !== 'undefined') {
            // See if the name is a formatted name
            if (url.name.search('{' !== -1)) {
                filename = this._formatFileName(url, url.name);
            } else {
                filename = url.name;
            }
        } else {
            // Create the filename based on the URL
            if (this.nameFormat.length > 0) {
                filename = this._formatFileName(url, this.nameFormat);
            } else {
                filename = this._formatFileName(url, '{url}');
            }
        }

        // Add the extension
        ext = this._validateType(extname(filename).toLowerCase().replace('.', ''));
        if (ext) {
            setExt = false
        }
        if (setExt) {
            filename += '.' + type;
        }

        return filename;
    }

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
     */
    _formatFileName(url, name) {
        // Set up the "url" portion of the name
        let urlName = url.url.replace(/http(s?):\/\//, '');
        urlName = sanitize(urlName, { replacement: '-' });
        urlName = urlName.replace(/\.+/g, '-');
        urlName = urlName.replace(/-{2,}/g, '-');
        if (urlName.substring(urlName.length - 1) == '-') {
            urlName = urlName.substring(0, urlName.length - 1);
        }
        if (urlName.substring(0, 1) == '-') {
            urlName = urlName.substring(1);
        }

        // Get the URL stub
        let stub = url.url.replace(/http(s?):\/\//, '');
        let stubParts = stub.split('/');
        stub = stub.replace(stubParts[0], '').trim();
        if (stub == '/' || stub.length == 0) {
            stub = 'home';
        } else {
            if (stub.substring(0, 1) == '/') {
                stub = stub.substring(1);
            }
            stub = sanitize(stub, { replacement: '-' });
            stub = stub.replace(/\.+/g, '-');
            stub = stub.replace(/-{2,}/g, '-');
            if (stub.substring(stub.length - 1) == '-') {
                stub = stub.substring(0, stub.length - 1);
            }
            if (stub.substring(0, 1) == '-') {
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
        if (typeof url.sizeName === 'undefined' || (typeof url.sizeName !== 'string' || url.sizeName.length == 0)) {
            url.sizeName = url.width + 'x' + url.height;
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

    /**
     * Gets whether or not the screenshot should be full screen for the URL
     * @param {object} url The URL object
     * @return {boolean}
     */
    _getFullScreen(url) {
        let fullScreen = this.fullScreen;
        if (typeof url.fit !== 'undefined') {
            if (url.fit === true || url.fit === 'true' || url.fit === 'y' || url.fit === 'yes') {
                fullScreen = false;
            } else {
                fullScreen = true;
            }
        }
        if (typeof url.full !== 'undefined') {
            if (url.full === true || url.full === 'true' || url.full === 'y' || url.full === 'yes') {
                fullScreen = true;
            } else {
                fullScreen = false;
            }
        }
        return fullScreen;
    }

    /**
     * Gets the height to view the page as
     * @param {object} url The URL object
     * @return {integer}
     */
    _getHeight(url) {
        let height = this.height;
        if (typeof url.height === 'number') {
            let num = parseInt(url.height);
            if (num > 1) {
                height = num;
            }
        }
        return height;
    }

    /**
     * Gets the path to save the screenshot at
     * @param {object} url The URL object
     * @return string
     */
    _getPath(url) {
        let dir = this._getDir(url),
            filename;
        if (typeof url.filename !== 'undefined') {
            filename = url.filename;
        } else {
            filename = this._getFilename(url);
        }
        return join(dir, filename);
    }

    /**
     * Gets whether or not the screenshot should be full screen for the URL
     * @param {object} url The URL object
     * @return {integer}
     */
    _getQuality(url) {
        let quality = this.quality;
        if (typeof url.quality === 'number') {
            let num = parseInt(url.quality);
            if (num > 0 && num <= 100) {
                quality = num;
            }
        }
        return quality;
    }

    /**
     * Gets the sizes for a URL
     * @param {object} url The URL object
     * @return {Array}
     */
    _getSizes(url) {
        let sizes = this.sizes,
            temp = [];
        if (typeof url.sizes !== 'undefined' && Array.isArray(url.sizes) && url.sizes.length > 0) {
            for (let size of url.sizes) {
                if (typeof size === 'object' && typeof size.width !== undefined && typeof size.height !== 'undefined') {
                    size.width = parseInt(size.width);
                    size.height = parseInt(size.height);
                    if (size.width > 0 && size.height > 0) {
                        temp.push(size);
                    }
                } else if (typeof size == 'string') {
                    let sizeParts = size.split('x');
                    if (sizeParts.length == 2) {
                        let width = parseInt(sizeParts[0]);
                        let height = parseInt(sizeParts[1]);
                        if (width > 0 && height > 0) {
                            temp.push({ width: width, height: height });
                        }
                    }
                }
            }
            if (temp.length > 0) {
                sizes = temp;
            }
        }
        return sizes;
    }

    /**
     * The file type to save the screenshot as
     * @param {object} url The URL object
     * @return {string}
     */
    _getType(url) {
        let type = this.fileType;
        if (typeof url.type !== 'undefined') {
            let urlType = this._validateType(url.type);
            if (urlType) {
                type = urlType;
            }
        }
        return type;
    }

    /**
     * Gets the width to view the page as
     * @param {object} url The URL object
     * @return {integer}
     */
    _getWidth(url) {
        let width = this.width;
        if (typeof url.width === 'number') {
            let num = parseInt(url.width);
            if (num > 1) {
                width = num;
            }
        }
        return width;
    }

    /**
     * Gets the configuration object for changing the page viewport
     * @param {object} url The URL information
     * @returns {object}
     */
    _getViewportConfig(url) {
        let config = {
            width: url.width,
            height: url.height
        };
        return config;
    }

    /**
     * Gets the configuration object for taking a screenshot
     * @param {object} url The URL information
     * @returns {object}
     */
    _getScreenshotConfig(url) {
        let config = {
            fullPage: url.fullScreen,
            path: url.path
        };
        if (url.type == 'jpg') {
            config.quality = url.quality;
        }
        if (url.clip) {
            config.fullPage = false;
            config.clip = url.clip;
        }
        return config;
    }

    /**
     * Prints the total time that it took to get all screenshots
     * @return {string}
     */
    _getPageElapsedTime() {
        let diff = process.hrtime(this.pageStartTime);
        let time = diff[0] + diff[1] / 1e9;
        return time + 's';
    }

    /**
     * Prints the total time that it took to get all screenshots
     */
    _printElapsedTime() {
        let diff = process.hrtime(this.startTime);
        let time = diff[0] + diff[1] / 1e9;
        console.log(bold('Total time to get screenshots: ') + time + 's');
    }
}

/**
 * JSON parser
 */
class jsonParse {
    /**
     * Constructor
     */
    constructor() {
        this.file = 'shots.json';
    }

    /**
     * Set the JSON file name
     * @param {string} file The file name
     */
    setFile(file) {
        if (typeof file === 'string' && file.length > 0) {
            let ext = extname(file).toLowerCase().replace('.', '');
            if (ext.length === 0) {
                file += '.json';
            }
            this.file = file;
        }
    }

    /**
     * Gets the name of the JSON file
     * @return {string}
     */
    getFile() {
        return this.file;
    }

    /**
     * Parse the JSON file
     * @return {object|false}
     */
    parse() {
        let file,
            returnData = false;
        try {
            if (existsSync(this.file)) {
                file = readFileSync(this.file, 'utf8');
                returnData = JSON.parse(file);
            }
        } catch (err) {
            console.log(red('Error while reason the JSON config file ' + this.file));
            console.log(red(err));
            process.exit();
        }
        return returnData;
    }
}

export const pageShots = new PageShots();
export const json = new jsonParse();