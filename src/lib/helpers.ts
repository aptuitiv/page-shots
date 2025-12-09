/* ===========================================================================
    Helper functions
=========================================================================== */

import { extname, join } from 'path';
import { Page } from 'puppeteer';
import sanitize from 'sanitize-filename';
import { parse } from 'tldts';

// Library
import { ConfigParser } from '../config.js';
import { isStringWithValue } from './types.js';
import {
    type Config,
    type SizeData,
    type UrlData,
    type UrlParamObject,
} from '../types.js';

/**
 * Hides the elements on the page that match the given CSS selectors.
 *
 * @param {Page} page The page object
 * @param {string[]} selectors The array of CSS selectors to hide
 * @returns {Promise<void>} A promise that resolves when the elements have been hidden
 */
export const hideElements = async (
    page: Page,
    selectors: string[]
): Promise<void> => {
    const promises = [];
    selectors.forEach((selector) => {
        promises.push(
            page.evaluate((sel) => {
                document.querySelectorAll(sel).forEach((element) => {
                    // eslint-disable-next-line no-param-reassign -- Must set display to none to hide the element
                    (element as HTMLElement).style.display = 'none';
                });
            }, selector)
        );
    });
    await Promise.all(promises);
};

/**
 * Cleans the url by removing the leading "/" and replacing periods with "-" and double "-" with a single "-".
 *
 * @param {string} value The value to clean
 * @returns {string} The cleaned value
 */
const cleanUrl = (value: string): string => {
    let returnValue = value;
    if (returnValue.startsWith('/')) {
        returnValue = returnValue.substring(1);
    }
    returnValue = sanitize(returnValue, { replacement: '-' });
    returnValue = returnValue.replace(/\.+/g, '-');
    returnValue = returnValue.replace(/-{2,}/g, '-');
    if (returnValue.substring(returnValue.length - 1) === '-') {
        returnValue = returnValue.substring(0, returnValue.length - 1);
    }
    if (returnValue.substring(0, 1) === '-') {
        returnValue = returnValue.substring(1);
    }
    return returnValue;
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
    const urlObject = new URL(url.url);
    const tldtsResult = parse(url.url);

    // Set up the "url" portion of the name
    let urlName = `${urlObject.hostname}${urlObject.pathname}`;
    urlName = cleanUrl(urlName);

    // Get the URL without the "www." prefix
    const urlNoWww = urlName.replace(/^www-/, '').replace(/^www\./, '');

    // Get the hostname
    const hostName = cleanUrl(urlObject.hostname);
    const hostNameNoWww = hostName.replace(/^www-/, '').replace(/^www\./, '');

    // Get the domain name parts
    const domainName = cleanUrl(tldtsResult.domain);
    const secondLevelDomain = cleanUrl(tldtsResult.domainWithoutSuffix);
    const topLevelDomain = cleanUrl(tldtsResult.publicSuffix);
    const subdomain = cleanUrl(tldtsResult.subdomain);

    // Get the URL path/stub
    let path = urlObject.pathname;
    if (path === '/' || path.length === 0) {
        path = 'home';
    } else {
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        path = cleanUrl(path);
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
    returnValue = returnValue.replace(/{hostname}/g, hostName);
    returnValue = returnValue.replace(/{hostnameNoWww}/g, hostNameNoWww);
    returnValue = returnValue.replace(/{domain}/g, domainName);
    returnValue = returnValue.replace(
        /{(secondLevelDomain|sld)}/g,
        secondLevelDomain
    );
    returnValue = returnValue.replace(
        /{(topLevelDomain|tld)}/g,
        topLevelDomain
    );
    returnValue = returnValue.replace(/{subdomain}/g, subdomain);
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
 * Gets the path to save the screenshot at
 *
 * @param {UrlData|SizeData} url The URL object
 * @returns {string}
 */
export const getUrlPath = (url: UrlData | SizeData): string => {
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
export const setupUrl = (url: UrlParamObject, config: Config): UrlData => {
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

    // Set the path to the path of the URL.
    // This needs to be done after the URL has been set up to ensure that the URL is valid.
    urlData.path = getUrlPath(urlData);

    // Return the URL data object
    return urlData;
};
