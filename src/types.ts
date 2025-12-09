/* ===========================================================================
    Holds the types that are shared across the project
=========================================================================== */

import { BoolLike } from './lib/types.js';
import { type ImageFormat, type PuppeteerLifeCycleEvent } from 'puppeteer';

// The clip parameter type
type ClipParam = {
    h: string | number;
    w: string | number;
    x: string | number;
    y: string | number;
};

// The base configuration parameters without the "sizes" or "urls" properties because
// those can include these configuration parameters.
type BaseConfigParam = {
    // The base URL to prepend to each URL if necessary
    base?: string; // CLI argument
    baseUrl?: string; // JSON config
    // Holds an object which specifies clipping region of the page.
    clip?: ClipParam; // JSON config
    // The x coordinate of the clipping region
    clipX?: string | number;
    // The y coordinate of the clipping region
    clipY?: string | number;
    // The width of the clipping region
    clipWidth?: string | number;
    // The height of the clipping region
    clipHeight?: string | number;
    // The name of the JSON config file to use to get the screenshots. If this is set all other arguments are ignored.
    config?: string;
    // The number of milliseconds to delay after loading before taking a picture of the page. Can not be greater than 30000.
    delay?: number | string;
    // The directory that screenshots are saved in
    dir?: string;
    // Whether or not to fit the screenshot to the provided height and width.
    fit?: BoolLike;
    // Whether or not to get a full page screenshot. Alternate to "fullscreen" and"fit".
    full?: BoolLike;
    // Whether or not to get a full page screenshot. Alternate to "full" and "fit".
    fullscreen?: BoolLike;
    fullScreen?: BoolLike;
    // The height of the viewport to take the screenshot in
    height?: number | string;
    // Whether or not to save the screenshot as a jpg
    jpg?: BoolLike;
    // The name of the file to save the screenshot as. Only applies to the first URL.
    name?: string;
    // The device pixel ratio to use for the screenshot. Default is 1.
    pixelRatio?: number | string;
    // Whether or not to save the screenshot as a png
    png?: BoolLike;
    // The image quality if the screenshot is a jpg
    quality?: number | string;
    // The number of milliseconds to delay after each scroll to allow the content to load.
    // This is used to allow time for lazy loading of images or animations that are triggered by the scroll to complete.
    scrollDelay?: number | string;
    // This determines the maximum pixel height of the screenshot that can be taken natively before falling back to stitching screenshots together. It's based on the maximum texture size supported by Chromium's software GL backend. Visit https://webglreport.com/ in Chrome and check the 'Max Texture Size' value to see the maximum texture size supported by the browser.
    stitchThreshold?: number | string;
    // The file type to use for the screenshots
    type?: ImageFormat;
    // The list of URLs to get screenshots for
    urls?: string[]; // JSON config
    // The wait until value to use for the page
    // See https://pptr.dev/api/puppeteer.puppeteerlifecycleevent
    // domcontentloaded: Wait for the for the DOMContentLoaded event, which occurs once the HTML document has been completely loaded and parsed. This does not guarantee that stylesheets, images, or any other resources are loaded.
    // load: Wait for the load event. This signals that the entire page and all its resources such as images, stylesheets, javascript, etc. have been fully loaded.
    // networkidle0: The networkidle0 event is fired when there are activenetwork connections for at least 500 ms.
    // networkidle2: The networkidle2 event is fired when there are no more than 2 active network connections for at least 500 ms.
    waitUntil?: string;
    // Whether or not to save the screenshot as a webp
    webp?: BoolLike;
    // The width of the viewport to take the screenshot in
    width?: number | string;
};

// The size object type if the size parameter is an object
export type SizeParamObject = BaseConfigParam & {
    // The height of the viewport to take the screenshot in
    height: number | string;
    // The width of the viewport to take the screenshot in
    width: number | string;
};

// The size value type
export type SizeParam = string | string[] | SizeParamObject;

// The URL object type if the URL parameter is an object
export type UrlParamObject = BaseConfigParam & {
    url: string;
};

// The URL value type
export type UrlParam = string | UrlParamObject;

export type ConfigParam = BaseConfigParam & {
    // Holds one or more viewport sizes to get the screenshot in
    size?: SizeParam;
    sizes?: SizeParam;
    // The list of URLs to get screenshots for
    url?: UrlParam; // This will be an array from the CLI arguments
    // The list of URLs to get screenshots for
    urls?: UrlParam[]; // JSON config
};

// The clip type
export type Clip = {
    x: number;
    y: number;
    width: number;
    height: number;
};

// The base configuration type. This is the configuration object without the "sizes" or "urls" properties because
// those can include these configuration parameters.
type BaseConfig = {
    baseUrl: string;
    clip: false | Clip;
    delay: number;
    deviceScaleFactor: number;
    dir: string;
    fileName: string;
    fileType: ImageFormat;
    fullScreen: boolean;
    height: number;
    nameFormat: string;
    quality: number;
    scrollDelay: number;
    stitchThreshold: number;
    waitUntil: PuppeteerLifeCycleEvent;
    width: number;
};

// The size configuration type. This is the configuration object for a single size.
export type SizeConfig = BaseConfig & {
    height: number;
    width: number;
};

// The URL configuration type. This is the configuration object for a single URL.
export type UrlConfig = BaseConfig & {
    sizes: SizeParamObject[];
    url: string;
};

// The configuration type
export type Config = BaseConfig & {
    sizes: SizeParamObject[];
    urls: UrlParamObject[];
};

// The URL data object after it has been set up
export type UrlData = UrlConfig & {
    path: string;
};

// The size data object after it has been set up
export type SizeData = SizeConfig & {
    path: string;
    url: string;
};
