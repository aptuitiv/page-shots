#! /usr/bin/env node

// src/index.ts
import { Command, Option } from "commander";
import fs4 from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// src/config.ts
import fs from "fs-extra";
import { extname } from "path";

// src/lib/log.ts
import chalk from "chalk";
import fancyLog from "fancy-log";
import logSymbols from "log-symbols";
var logInfo = (message, additionalMessage) => {
  if (additionalMessage) {
    fancyLog(
      logSymbols.info,
      chalk.blue(message),
      chalk.cyan(additionalMessage)
    );
  } else {
    fancyLog(logSymbols.info, chalk.blue(message));
  }
};
var logMessage = (message, additionalMessage) => {
  fancyLog(chalk.cyan(message), additionalMessage ?? "");
};
var logSuccess = (message, additionalMessage) => {
  if (additionalMessage) {
    fancyLog(
      logSymbols.success,
      chalk.green(message),
      chalk.cyan(additionalMessage)
    );
  } else {
    fancyLog(logSymbols.success, chalk.green(message));
  }
};
var logError = (message, error) => {
  fancyLog(logSymbols.error, chalk.red(message));
  if (error) {
    fancyLog(chalk.red(error.message));
    fancyLog(chalk.red(error.stack));
  }
};

// src/lib/types.ts
var isFalseLike = (thing) => ["n", "no", false, "false"].includes(thing);
var isTrueLike = (thing) => ["y", "yes", true, "true"].includes(thing);
var isBoolLike = (thing) => isTrueLike(thing) || isFalseLike(thing);
var isDefined = (thing) => typeof thing !== "undefined";
var isNumber = (thing) => !Number.isNaN(thing) && typeof thing === "number" && thing !== Infinity;
var isNumberString = (thing) => typeof thing === "string" && thing.trim().length > 0 && !Number.isNaN(Number(thing)) && thing !== "Infinity";
var isNumberOrNumberString = (thing) => isNumber(thing) || isNumberString(thing);
var isObject = (thing) => Object.prototype.toString.call(thing) === "[object Object]";
var isObjectWithValues = (thing) => Object.prototype.toString.call(thing) === "[object Object]" && Object.keys(thing).length > 0;
var isString = (thing) => typeof thing === "string";
var isStringWithValue = (thing) => isString(thing) && thing.trim().length > 0;

// src/lib/object.ts
var objectHasValue = (obj, key) => isObject(obj) && key in obj;
var objectValueIsNumberOrNumberString = (obj, key) => objectHasValue(obj, key) && isNumberOrNumberString(obj[key]);
var objectValueIsStringWithValue = (obj, key) => objectHasValue(obj, key) && isStringWithValue(obj[key]);

// src/config.ts
var defaultConfig = {
  // The base URL to prepend to each URL if necessary
  baseUrl: "",
  // Holds an object which specifies clipping region of the page.
  clip: false,
  // The number of milliseconds to delay after loading before taking a picture of the page
  delay: 0,
  // The device scale factor to use for the screenshot. Puppeteer default is 1.
  deviceScaleFactor: 1,
  // The directory that screenshots are saved in
  dir: "",
  // The file name to save the screenshots as.
  // This is only used if a specific file name is set in the configuration or the CLI arguments
  // and the name doesn't include {} placeholders.
  fileName: "",
  // The file type to save the screenshots as
  fileType: "jpeg",
  // Holds whether or not the screenshot should be full page
  fullScreen: true,
  // Holds the viewport height to get the screenshot in
  height: 900,
  // The format to generate the file name from
  nameFormat: "{urlNoWww}-{width}",
  // The image quality if the screenshot is a jpg
  quality: 100,
  // The number of milliseconds to delay after each scroll to allow the content to load.
  // This is used to allow time for lazy loading of images or animations that are triggered by the scroll to complete.
  scrollDelay: 400,
  // Holds one or more viewport sizes to get the screenshot in
  sizes: [],
  // This determines the maximum pixel height of the screenshot that can be taken natively before falling back to stitching screenshots together. It's based on the maximum texture size supported by Chromium's software GL backend. Visit https://webglreport.com/ in Chrome and check the 'Max Texture Size' value to see the maximum texture size supported by the browser.
  stitchThreshold: 16e3,
  // The list of URLs to get screenshots for
  urls: [],
  // The wait until value to use for the page
  waitUntil: "load",
  // Holds the viewport width to get the screenshot in
  width: 1300
};
var maxDelay = 3e4;
var processHeightWidth = (value) => {
  let returnValue = 0;
  if (isNumberOrNumberString(value)) {
    const size = parseInt(value.toString(), 10);
    if (size > 0) {
      returnValue = size;
    }
  }
  return returnValue;
};
var validateFileType = (type) => {
  let returnVal = false;
  if (isStringWithValue(type)) {
    let fileType = type.toLowerCase().replace(".", "");
    if (["jpg", "jpeg", "png", "webp"].includes(fileType)) {
      if (fileType === "jpg") {
        fileType = "jpeg";
      }
      returnVal = fileType;
    }
  }
  return returnVal;
};
var ConfigParser = class {
  /**
   * Holds the configuration data.
   *
   * It defaults to the default configuration.
   * As each configuration param is processed, this will be updated with the new values.
   *
   * @type {Config}
   */
  config;
  /**
   * Holds the configuration data being worked on.
   *
   * @type {ConfigParam}
   */
  configParam;
  /**
   * Holds whether or not to process the configuration URL if it's included in the config data.
   *
   * @type {boolean}
   */
  processFile;
  /**
   * Holds whether or not to process the configuration sizes if it's included in the config data.
   *
   * @type {boolean}
   */
  processSizes;
  /**
   * Holds whether or not to process the configuration URLs if it's included in the config data.
   *
   * @type {boolean}
   */
  processUrls;
  /**
   * Constructor
   *
   * @param {Config|SizeConfig|UrlConfig} baseConfig The default configuration to use instead of the core default configuration
   */
  constructor(baseConfig) {
    this.config = { ...defaultConfig };
    if (isObjectWithValues(baseConfig)) {
      const baseConfigObject = { ...baseConfig };
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
  parse(data) {
    if (isObjectWithValues(data)) {
      if (this.setProcessConfigFile && isStringWithValue(data?.config)) {
        this.#parseFile(data.config);
      }
      this.#parseConfig(data);
    }
  }
  /**
   * Parse the JSON config file and merge it with the current config
   *
   * @param {string} file The name of the JSON config file to parse
   */
  #parseFile(file) {
    try {
      let configFile = "shots.json";
      if (typeof file === "string" && file.length > 0) {
        configFile = file;
        const ext = extname(file).toLowerCase().replace(".", "");
        if (ext.length === 0) {
          configFile += ".json";
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
  #parseConfig(data) {
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
    this.#setHideElement();
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
  getConfig() {
    return this.config;
  }
  /**
   * Checks if the configuration has URLs
   *
   * @returns {boolean}
   */
  hasUrls() {
    return this.config.urls.length > 0;
  }
  /**
   * Set the base URL value
   *
   * Remove the trailing slash from the base URL if it exists
   */
  #setBaseUrl() {
    if (isStringWithValue(this.configParam?.base)) {
      this.config.baseUrl = this.configParam.base.replace(/\/$/, "");
    } else if (isStringWithValue(this.configParam?.baseUrl)) {
      this.config.baseUrl = this.configParam.baseUrl.replace(/\/$/, "");
    }
  }
  /**
   * Set the clip data
   */
  #setClip() {
    if (isObjectWithValues(this.configParam?.clip)) {
      if (objectValueIsNumberOrNumberString(this.configParam.clip, "x") && objectValueIsNumberOrNumberString(this.configParam.clip, "y") && objectValueIsNumberOrNumberString(this.configParam.clip, "w") && objectValueIsNumberOrNumberString(this.configParam.clip, "h")) {
        const x = parseInt(this.configParam.clip.x.toString(), 10);
        const y = parseInt(this.configParam.clip.y.toString(), 10);
        const w = parseInt(this.configParam.clip.w.toString(), 10);
        const h = parseInt(this.configParam.clip.h.toString(), 10);
        if (x >= 0 && y >= 0 && w > 0 && h > 0) {
          this.config.clip = {
            x,
            y,
            width: w,
            height: h
          };
        }
      }
    } else if (isNumberOrNumberString(this.configParam?.clipWidth) && isNumberOrNumberString(this.configParam?.clipHeight)) {
      const clipX = isNumberOrNumberString(this.configParam?.clipX) ? this.configParam.clipX : 0;
      const clipY = isNumberOrNumberString(this.configParam?.clipY) ? this.configParam.clipY : 0;
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
      this.config.dir = this.configParam.dir.replace(/\/$/, "");
    }
  }
  /**
   * Sets the file name for the first URL or the name pattern to use for all URLs
   *
   */
  #setFileName() {
    if (isStringWithValue(this.configParam?.name)) {
      if (this.configParam.name.includes("{")) {
        this.config.nameFormat = this.configParam.name;
      } else {
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
      this.config.fileType = "jpeg";
    }
    if (isTrueLike(this.configParam?.png)) {
      this.config.fileType = "png";
    }
    if (isTrueLike(this.configParam?.webp)) {
      this.config.fileType = "webp";
    }
  }
  /**
   * Sets whether or not to get a full page screenshot
   *
   */
  #setFullScreen() {
    if (isBoolLike(this.configParam?.fit) || isBoolLike(this.configParam?.fullscreen) || isBoolLike(this.configParam?.fullScreen) || isBoolLike(this.configParam?.full)) {
      let fullScreen = true;
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
   * Sets the CSS selector of the element to hide during the screenshot process.
   * The elements are hidden before any screenshot or scrolling is done.
   */
  #setHideElement() {
    if (isStringWithValue(this.configParam?.hideSelector)) {
      this.config.hideSelector = [this.configParam.hideSelector];
    } else if (Array.isArray(this.configParam.hideSelector)) {
      this.config.hideSelector = [];
      this.configParam.hideSelector.forEach((hideSelector) => {
        if (isStringWithValue(hideSelector)) {
          this.config.hideSelector.push(hideSelector);
        }
      });
    }
  }
  /**
   * Sets the CSS selector of the element to hide during the screenshot process if screenshots are stitched together. The elements are hidden after the first scroll. Common usage is to hide a sticky header or floating element.
   */
  #setHideStitchElement() {
    if (isStringWithValue(this.configParam?.hideStitchSelector)) {
      this.config.hideStitchSelector = [
        this.configParam.hideStitchSelector
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
    if (Array.isArray(this.configParam?.urls) && this.configParam.urls.length > 0) {
      for (const url of this.configParam.urls) {
        this.#configureUrl(url);
      }
    } else if (isStringWithValue(this.configParam?.urls)) {
      this.#configureUrl(this.configParam.urls);
    } else if (Array.isArray(this.configParam?.url) && this.configParam.url.length > 0) {
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
  #configureUrl(url) {
    if (isObjectWithValues(url) && objectValueIsStringWithValue(url, "url")) {
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
  #processViewportSizes(sizes) {
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
  #configureViewportSize(size) {
    if (isStringWithValue(size)) {
      const sizes = size.split("x");
      if (sizes.length === 2) {
        const width = parseInt(sizes[0], 10);
        const height = parseInt(sizes[1], 10);
        if (width > 0 && height > 0) {
          this.config.sizes.push({
            height,
            width
          });
        }
      }
    } else if (objectValueIsNumberOrNumberString(size, "width") && objectValueIsNumberOrNumberString(size, "height")) {
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
      if ([
        "domcontentloaded",
        "load",
        "networkidle0",
        "networkidle2"
      ].includes(waitUntil)) {
        this.config.waitUntil = waitUntil;
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
};

// src/init.ts
import { createWriteStream } from "fs";
import { extname as extname2, join } from "path";
import chalk2 from "chalk";
import sanitize from "sanitize-filename";
import ora from "ora";
var initJson = {
  /**
   * The name of the directory to save the file in
   *
   * @type {string}
   */
  dir: "",
  /**
   * The name of the file to save the JSON file as
   *
   * @type {string}
   */
  filename: "shots.json",
  /**
   * Set the name of the directory to save the file in
   *
   * @param {string} dir The name of the diectory to save the file in
   */
  setDir(dir) {
    if (typeof dir === "string") {
      let directory = dir.trim();
      if (directory.length > 1) {
        if (directory.substring(directory.length - 1) !== "/") {
          directory = `${directory}/`;
        }
        this.dir = directory;
      }
    }
  },
  /**
   * Set the file name for the JSON file
   *
   * @param {string} name The filename for the JSON file
   */
  setFilename(name) {
    const ext = extname2(name).toLowerCase().replace(".", "");
    let filename = name;
    if (ext !== "json") {
      filename += ".json";
    }
    filename = sanitize(filename, { replacement: "-" });
    this.filename = filename;
  },
  /**
   * Builds and saves the json file
   */
  build() {
    const json = {
      baseUrl: "",
      name: "{url}-{width}",
      type: "jpg",
      urls: [],
      sizes: ["1300x800"]
    };
    const filePath = join(this.dir, this.filename), spinner = ora({
      text: `Creating ${this.filename}`,
      spinner: "arc"
    }).start();
    const writeStream = createWriteStream(filePath, { flags: "w" });
    writeStream.write(JSON.stringify(json, null, 4));
    writeStream.close();
    spinner.succeed(chalk2.green(`${this.filename} created`));
  }
};
var init_default = initJson;

// src/screenshot.ts
import fs3 from "fs-extra";
import { dirname, extname as extname3, join as join2 } from "path";
import { Cluster } from "puppeteer-cluster";
import sanitize2 from "sanitize-filename";
import puppeteerExtraModule from "puppeteer-extra";
import AdblockerPluginModule from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { setTimeout as setTimeout2 } from "timers/promises";
import { parse } from "tldts";

// src/lib/time.ts
function getStartTime() {
  return process.hrtime.bigint();
}
function getElapsedTime(startTime) {
  const endTime = process.hrtime.bigint();
  const startTimeNumber = Number(startTime);
  const endTimeNumber = Number(endTime);
  const elapsedTime = endTimeNumber - startTimeNumber;
  return (elapsedTime / 1e9).toFixed(4);
}

// src/full-page-screenshot.ts
import fs2 from "fs-extra";
import sharp from "sharp";
import { setTimeout } from "timers/promises";

// src/lib/helpers.ts
var hideElements = async (page, selectors) => {
  const promises = [];
  selectors.forEach((selector) => {
    promises.push(
      page.evaluate((sel) => {
        document.querySelectorAll(sel).forEach((element) => {
          element.style.display = "none";
        });
      }, selector)
    );
  });
  await Promise.all(promises);
};

// src/full-page-screenshot.ts
var stitchImages = async (scrBuffers, width, extraHeight) => {
  const numBuffers = scrBuffers.length;
  const sharpImages = await Promise.all(
    scrBuffers.map((buf, index) => {
      const img = sharp(buf).ensureAlpha().raw();
      if (index === numBuffers - 1 && extraHeight > 0) {
        img.resize({
          height: extraHeight,
          width,
          position: "bottom"
        });
      }
      return img.toBuffer({ resolveWithObject: true });
    })
  );
  const totalHeight = sharpImages.reduce(
    (sum, img) => sum + img.info.height,
    0
  );
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
        channels: img.info.channels
      }
    });
    offset += img.info.height;
  }
  return sharp({
    create: {
      width,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  }).composite(composites).png().toBuffer();
};
var getPageHeight = async (page) => page.evaluate(() => document.documentElement.scrollHeight);
async function scrollDown(page) {
  await page.evaluate(() => {
    window.scrollBy({
      left: 0,
      top: window.innerHeight,
      behavior: "instant"
    });
  });
}
var getPageSizeInfo = async (page) => page.evaluate(() => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const pageHeight = document.documentElement.scrollHeight;
  return {
    pages: Math.ceil(pageHeight / window.innerHeight),
    extraHeight: pageHeight % window.innerHeight * window.devicePixelRatio,
    pageHeight,
    viewport: {
      height: window.innerHeight * window.devicePixelRatio,
      width: window.innerWidth * window.devicePixelRatio
    }
  };
});
var getFullPageScreenshot = async (page, url, screenshotConfig) => {
  const maxScrollLoops = 50;
  const { stitchThreshold } = url;
  try {
    page.on("console", (consoleObj) => {
      if (consoleObj.type() === "log") {
        logMessage(consoleObj.text());
      }
    });
    let pageSizeInfo = await getPageSizeInfo(page);
    let lastHeight = pageSizeInfo.viewport.height;
    let sameHeightCount = 0;
    for (let index = 0; index < maxScrollLoops; index += 1) {
      await scrollDown(page);
      await setTimeout(url.scrollDelay);
      const newHeight = await getPageHeight(page);
      if (newHeight === lastHeight) {
        sameHeightCount++;
      } else {
        sameHeightCount = 0;
      }
      if (sameHeightCount >= 3) break;
      lastHeight = newHeight;
    }
    pageSizeInfo = await getPageSizeInfo(page);
    await page.evaluate(
      () => window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    );
    await setTimeout(100);
    const fullHeight = await getPageHeight(page);
    if (fullHeight <= stitchThreshold) {
      await page.screenshot(screenshotConfig);
    } else {
      const screenshotConf = { ...screenshotConfig };
      screenshotConf.captureBeyondViewport = false;
      const { path: path2 } = screenshotConf;
      delete screenshotConf.path;
      delete screenshotConf.fullPage;
      const sectionScreenshots = [];
      for (let index = 0; index < pageSizeInfo.pages; index += 1) {
        if (index > 0 && Array.isArray(url.hideStitchSelector)) {
          await hideElements(page, url.hideStitchSelector);
        }
        await setTimeout(100);
        const screenshot = await page.screenshot(screenshotConf);
        sectionScreenshots.push(screenshot);
        await scrollDown(page);
      }
      const stitchedScreenshot = await stitchImages(
        sectionScreenshots,
        pageSizeInfo.viewport.width,
        pageSizeInfo.extraHeight
      );
      fs2.writeFileSync(path2, stitchedScreenshot);
    }
  } catch (err) {
    logError("Error while taking the full page screenshot", err);
  }
};
var full_page_screenshot_default = getFullPageScreenshot;

// src/screenshot.ts
var puppeteerExtra = puppeteerExtraModule;
var AdblockerPlugin = AdblockerPluginModule;
var cleanUrl = (value) => {
  let returnValue = value;
  if (returnValue.startsWith("/")) {
    returnValue = returnValue.substring(1);
  }
  returnValue = sanitize2(returnValue, { replacement: "-" });
  returnValue = returnValue.replace(/\.+/g, "-");
  returnValue = returnValue.replace(/-{2,}/g, "-");
  if (returnValue.substring(returnValue.length - 1) === "-") {
    returnValue = returnValue.substring(0, returnValue.length - 1);
  }
  if (returnValue.substring(0, 1) === "-") {
    returnValue = returnValue.substring(1);
  }
  return returnValue;
};
var formatFileName = (url, name) => {
  const urlObject = new URL(url.url);
  const tldtsResult = parse(url.url);
  let urlName = `${urlObject.hostname}${urlObject.pathname}`;
  urlName = cleanUrl(urlName);
  const urlNoWww = urlName.replace(/^www-/, "").replace(/^www\./, "");
  const hostName = cleanUrl(urlObject.hostname);
  const hostNameNoWww = hostName.replace(/^www-/, "").replace(/^www\./, "");
  const domainName = cleanUrl(tldtsResult.domain);
  const secondLevelDomain = cleanUrl(tldtsResult.domainWithoutSuffix);
  const topLevelDomain = cleanUrl(tldtsResult.publicSuffix);
  const subdomain = cleanUrl(tldtsResult.subdomain);
  let path2 = urlObject.pathname;
  if (path2 === "/" || path2.length === 0) {
    path2 = "home";
  } else {
    if (path2.startsWith("/")) {
      path2 = path2.substring(1);
    }
    path2 = cleanUrl(path2);
  }
  let full = "full", fit = "fit";
  if (url.fullScreen) {
    fit = "full";
  } else {
    full = "fit";
  }
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
  returnValue = returnValue.replace(/{(path|stub)}/g, path2);
  returnValue = returnValue.replace(/{width}/g, url.width.toString());
  returnValue = returnValue.replace(/{height}/g, url.height.toString());
  returnValue = returnValue.replace(/{quality}/g, url.quality.toString());
  returnValue = returnValue.replace(/{full}/g, full);
  returnValue = returnValue.replace(/{fit}/g, fit);
  returnValue = returnValue.replace(/{size}/g, `${url.width}x${url.height}`);
  return returnValue;
};
var getScreenshot = async (page, url) => {
  let message = `Viewport size: ${url.width}px / ${url.height}px`;
  if (url.clip) {
    message += `, Clip: ${url.clip.x}px / ${url.clip.y}px / ${url.clip.width}px / ${url.clip.height}px`;
  }
  if (url.fullScreen) {
    message += `, Full screen`;
  }
  logMessage(`Taking screenshot of ${url.url}`, message);
  const dir = dirname(url.path);
  if (dir.length > 0 && !fs3.existsSync(dir)) {
    fs3.mkdirSync(dir, { recursive: true });
  }
  await page.setViewport({
    deviceScaleFactor: url.deviceScaleFactor,
    height: url.height,
    width: url.width
  });
  const goToOptions = {
    timeout: 6e4,
    waitUntil: url.waitUntil
  };
  await page.goto(url.url, goToOptions);
  if (url.delay > 0) {
    logInfo(`Delaying ${url.url} ${url.delay} milliseconds`);
    await setTimeout2(url.delay);
  }
  if (Array.isArray(url.hideSelector)) {
    await hideElements(page, url.hideSelector);
  }
  try {
    const screenshotConfig = {
      fullPage: url.fullScreen,
      path: url.path,
      type: url.fileType
    };
    if (["jpeg", "webp"].includes(url.fileType)) {
      screenshotConfig.quality = url.quality;
    }
    if (url.clip) {
      screenshotConfig.fullPage = false;
      screenshotConfig.clip = url.clip;
    }
    if (screenshotConfig.fullPage) {
      await full_page_screenshot_default(page, url, screenshotConfig);
    } else {
      await page.screenshot(screenshotConfig);
    }
    logSuccess(`Saved ${url.path}`);
  } catch (err) {
    logError("Error while taking the screenshot", err);
  }
};
var getUrlPath = (url) => {
  let filename = "";
  if (isStringWithValue(url.fileName)) {
    filename = url.fileName;
  } else if (isStringWithValue(url.nameFormat)) {
    filename = formatFileName(url, url.nameFormat);
  } else {
    filename = formatFileName(url, "{url}");
  }
  const ext = extname3(filename).toLowerCase().replace(".", "");
  if (!isStringWithValue(ext) || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
    filename += `.${url.fileType}`;
  }
  return join2(url.dir, filename);
};
var setupUrl = (url, config) => {
  const configParser = new ConfigParser(config);
  configParser.setDoNotProcessUrls();
  configParser.setDoNotProcessSizes();
  configParser.parse(url);
  const urlConfig = configParser.getConfig();
  delete urlConfig.urls;
  const urlData = {
    ...urlConfig,
    url: url.url,
    path: ""
  };
  urlData.path = getUrlPath(urlData);
  if (isStringWithValue(urlData.baseUrl)) {
    if (urlData.url.substring(0, urlData.baseUrl.length) !== urlData.baseUrl && urlData.url.match(/^http(s?):\/\//) === null) {
      if (urlData.url.substring(0, 1) !== "/") {
        urlData.url = `/${urlData.url}`;
      }
      urlData.url = urlData.baseUrl + urlData.url;
    }
  }
  if (urlData.url.match(/^http(s?):\/\//) === null) {
    urlData.url = `https://${urlData.url}`;
  }
  return urlData;
};
var getScreenshots = async (config) => {
  try {
    const startTime = getStartTime();
    logMessage(
      `Getting screenshot${config.urls.length === 1 ? "" : "s"} for ${config.urls.length} URL${config.urls.length === 1 ? "" : "s"}.`
    );
    puppeteerExtra.use(StealthPlugin());
    puppeteerExtra.use(AdblockerPlugin());
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 10,
      puppeteer: puppeteerExtra
    });
    await cluster.task(async ({ page, data: url }) => {
      await getScreenshot(page, url);
    });
    for (const url of config.urls) {
      const urlObject = setupUrl(url, config);
      if (urlObject.sizes.length > 0) {
        urlObject.sizes.forEach((size) => {
          const configParser = new ConfigParser(urlObject);
          configParser.setDoNotProcessUrls();
          configParser.setDoNotProcessSizes();
          configParser.parse(size);
          const sizeConfig = configParser.getConfig();
          delete sizeConfig.sizes;
          delete sizeConfig.urls;
          const sizeData = {
            ...sizeConfig,
            url: urlObject.url,
            path: ""
          };
          sizeData.path = getUrlPath(sizeData);
          cluster.queue(sizeData);
        });
      } else {
        cluster.queue(urlObject);
      }
    }
    await cluster.idle();
    await cluster.close();
    const time = getElapsedTime(startTime);
    logMessage(`Total time to get screenshots: ${time}s`);
  } catch (err) {
    logError(`Error getting screenshots`, err);
    process.exit(1);
  }
};
var screenshot_default = getScreenshots;

// src/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var thisPackageJson = fs4.readJsonSync(
  path.resolve(__dirname, "../package.json")
);
var program = new Command();
program.version(thisPackageJson.version).description(thisPackageJson.description).option(
  "-b, --base <string>",
  "The base URL value. If set then the URL will be appended to this value."
).option("--clipH <integer>", "The height of clip area.").option("--clipW <integer>", "The width of clip area.").option(
  "--clipX <integer>",
  "The x-coordinate of top-left corner of clip area."
).option(
  "--clipY <integer>",
  "The y-coordinate of top-left corner of clip area."
).option(
  "-c, --config <string>",
  "The name of the JSON config file to use to get the screenshots. If this is set all other arguments are ignored."
).option(
  "-D, --delay <integer>",
  `The number of milliseconds to delay after loading before taking a picture of the page. Can not be greater than ${maxDelay}.`
).option(
  "-d, --dir <string>",
  "The directory relative to where the script is run to output the screenshots to."
).option("-f, --fit", "Fit the screenshot to the provided height and width.").option(
  "-F, --fullScreen <boolean>",
  "Whether or not to have the screenshot capture the full width and height of the page.",
  true
).option(
  "-h, --height <integer>",
  'Integer height of the viewport to take the screenshot in. Use "--fit" if you want the screenshot to only capture the viewport width and height.',
  "900"
).option(
  "--hideSelector <string...>",
  "The CSS selector of the element(s) to hide during the screenshot process. The elements are hidden before any screenshot or scrolling is done."
).option(
  "--hideStitchSelector <string...>",
  "The CSS selector of the element(s) to hide during the screenshot process if screenshots are stitched together. The elements are hidden after the first scroll. Common usage is to hide a sticky header or floating element."
).option(
  "--jpg",
  'Set the image type for screenshots to be "jpg". Alternate method to using --type.'
).option(
  "-n, --name <string>",
  "The name of the file to save the screenshot as. Only applies to the first URL."
).option(
  "--pixelRatio <number>",
  "The device pixel ratio to use for the screenshot. Default is 1."
).option(
  "--png",
  'Set the image type for screenshots to be "png". Alternate method to using -t.'
).option(
  "-q, --quality <integer>",
  "The quality of the jpg image, between 0-100. Not applicable to png image.",
  "100"
).option(
  "-s, --size <string...>",
  'A viewport size to capture the screenshot in. The format is WIDTHxHEIGHT. For example, 800x400 for a width of 800px and a height of 400px. Use "--fit" if you want the screenshot to only capture the viewport width and height.',
  []
).option(
  "--scrollDelay <integer>",
  "The number of milliseconds to delay after each scroll to allow the content to load. This is used to allow time for lazy loading of images or animations that are triggered by the scroll to complete.",
  "400"
).option(
  "--stitchThreshold <integer>",
  "This determines the maximum pixel height of the screenshot that can be taken natively before falling back to stitching screenshots together. It's based on the maximum texture size supported by Chromium's software GL backend. Visit https://webglreport.com/ in Chrome and check the 'Max Texture Size' value to see the maximum texture size supported by the browser.",
  "16000"
).addOption(
  new Option(
    "-t, --type <string>",
    "The file type to use for the screenshots."
  ).choices(["jpg", "png", "webp"]).default("jpg")
).option("-u, --url <string...>", "URL to get the screenshot of.", []).option(
  "-w, --width <integer>",
  "Integer width of the viewport to take the screenshot in.",
  "1300"
).addOption(
  new Option(
    "--waitUntil <string>",
    "The wait until value to use for the page."
  ).choices(["domcontentloaded", "load", "networkidle0", "networkidle2"])
).option(
  "--webp",
  'Set the image type for screenshots to be "webp". Alternate method to using -t.'
).action((options) => {
  const configParser = new ConfigParser();
  configParser.setProcessConfigFile();
  configParser.parse(options);
  if (configParser.hasUrls()) {
    screenshot_default(configParser.getConfig()).then(() => {
      logSuccess("All screenshots have been taken.");
    }).catch((err) => {
      logError("Error getting screenshots: ", err);
    });
  } else {
    logError(
      "No URLs were provided to get screenshots of. Nothing to do."
    );
  }
});
program.addHelpText(
  "after",
  `
  Examples:
    page-shots -d images -u https://www.mysite.com
    page-shots -u https://www.mysite.com -u https://www.mysite.com/page
    page-shots -d images -u https://www.mysite.com -w 900
    page-shots -d images -u https://www.mysite.com -w 900 -q 80
    page-shots -d images -u https://www.mysite.com -w 900 -t png
    page-shots -d images -u https://www.mysite.com -w 450 -h 800 --fit
    page-shots init
    page-shots
    page-shots -c myurls.json
`
);
program.command("init [file]").description(
  "Initialize the JSON file that is used to configure the URLs to get screenshots of."
).action((file) => {
  init_default.setDir(process.cwd());
  if (file) {
    init_default.setFilename(file);
  }
  init_default.build();
});
program.parse();
