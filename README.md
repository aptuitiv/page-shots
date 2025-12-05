Page Shots
====

Page Shots is a command line interface for taking screenshots of one or more pages of a website.

[![NPM version][shield-npm]][info-npm]
[![Node.js version support][shield-node]][info-node]
[![LGPL-3.0 licensed][shield-license]][info-license]

On the command line:

```
page-shots -u https://www.aptuitiv.com
```

There are, of course, a lot more configuration options.

Table Of Contents
-----------------

- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Filenames and Directories](#filenames-and-directories)
- [Full Screen and Fixed Size Screenshots](#full-size-and-fixed-size-screenshots)
- [Setting Screenshot Size](#setting-screenshot-size)
- [Setting URLs](#setting-urls)
- [Delaying the Screenshot](#delaying-the-screenshot)
- [Lazy Loaded Content](#lazy-loaded-content)
- [Command Line Options](#command-line-options)
- [Command Line Examples](#command-line-examples)
- [Use a JSON file to specify one or more URLs and configuration](#use-a-json-file-to-specify-one-or-more-urls-and-configuration)
- [License](#license)


Requirements
-----------------

Page Shots requires [Node.js][node] to run.



Install
-----------------

```
npm install -g page-shots
```


Usage
-----------------

There are two ways to use the Page Shots library.

1. Specify one or more URLs on the [command line](#command-line-options) to get screenshots for.
2. Use a [JSON file](#use-a-json-file-to-specify-one-or-more-urls-and-configuration) to specify one or more URLs and process it on the command line.

Filenames and Directories
-----------------

By default the screenshot will be saved in the same directory that you call the command in and by default the file name will be based on the URL of the page. Also, by default, the screenshot will be a jpg image.

For example, if the URL is `https://www.aptuitiv.com` then the file name will be `www-branchcms-com.jpg`.

You can specify a file name for the screenshot. The file name can be just the name without the extension, or if can include the "jpg" or "png" extension. If the file name does not have an extension or it doesn't match either "jpg" or "png" extension then the correct extension based on the `type` argument will be used.

If the file name does have an extension and the extension is `jpg` or `png`, then that will always override the file type. The file type will be set to match the extension.

The file name can include a directory path. For example: `screenshots/shot-{stub}-{width}.jpg`. If it does then the full path set by the file name will be appended to the directory setting value if that was specified.

Dynamic file names
-----------------

Instead of specifying a specific file name, you can specify a format to follow. There are a few placeholders that you can use in the file name to be replaced with information about the screenshot.

| Placeholder | Description  |
| :---------- | :----------- |
| {fit}       | `fit` if the screenshot will only be for the specified width and height. `full` if the screenshot will be for the full page. |
| {full}      | `fit` if the screenshot will only be for the specified width and height. `full` if the screenshot will be for the full page. |
| {height}    | The height of the screenshot or viewport. |
| {quality}   | The image quality of the jpg image. |
| {size}      | The name of the size. Set with the `key` value in a size object. If it's not set then the value will be the width and height separated by an "x". For example, `1300x800`. |
| {stub}      | The URL stub. This would be the part of the URL after the domain name. |
| {url}       | The filename friendly version of the URL. |
| {width}     | The width of the screenshot. |

The default file name format is `{url}-{width}`.

When you set the file name format you can optionally set the extension. As long as the extension is "jpg" or "png" then the image will be saved as a "jpg" or "png" image, respectively.

### Directories

You can specify a directory to save the screenshot(s) in. The directory will be relative to where you call the command. If the directory does not exist then it will be created.


Full Size and Fixed Size Screenshots
-----------------

By default all screenshots will capture the entire page, not just within the height and width specified. The `height` value is only used with full size screenshots if the height of the web page is less than the specified height.
In that case the screenshot will be the specified height. If the height of the web page is larger than the specified height then the actual height of the page will be used.

You can use the `--fit` option to only capture the page within the specified height and width.

You can go even further and capture just a clip of the page by using the `-clipH`, `-clipW`, `-clipX`, and `-clipY` options. You must specify all four parameters for a clip to be taken.

Setting Screenshot Size
-----------------

There are two ways that you can set the size of the screenshot size. (Note, the screenshot size is always in pixels.)

1. Set the size by setting the `width` and `height` values. The `height` value is only necessary if you want to capture only the exact height and width.
2. Set one or more sizes by setting the `size` value. The `size` value requires that both the width and height be set. This does not, however, force the screenshot to only
   match the exact width and height. By default all screenshots are full size. 

[Set multiple screenshot sizes on the command line](#set-multiple-screenshot-sizes).

[Set the screenshot size using the `size` argument on the command line](#set-the-screenshot-size-using-the-size-argument).

Setting URLs
-----------------

You can specify the full URL for each web page to capture. Or, if you're getting multiple screenshots in the same website, then you can set the base URL and then just specify the URL path for each web page.

For example, let's say that your website is `https://www.mysite.com` and you're wanting to capture the home page, the "about us" page and the contact page. You can first set the base URL to be `https://www.mysite.com` and then simply specify `/` for the home page, `about-us` for the about us page, and `contact` for the contact page.

Note, Page Shots is smart enough to ensure that there is only one `/` between the base URL and the page path.


Delaying the Screenshot
-----------------

If you need to wait for certain assets to load on the page before taking the screenshot then you set a specific number of milliseconds to wait after the page loads and before the screenshot is taken.

An example scenario could be if you have a Google Map section on the page and you want to make sure that it fully loads before taking the screenshot.

The delay happens after the page has loaded, the page has been scrolled from top to bottom, and right before the screenshot is taken.


Lazy Loaded Content
-----------------

Page Shots does it's best to handle lazy loaded content by first scrolling the entire page before taking the screenshot. A small delay of 100ms is then taken before doing the screenshot. The script then waits for all images to return that they have loaded. However, loading doesn't always mean displayed. If the screenshot doesn't display all images then the correct approach would be to add a [delay](#delaying-the-screenshot) before the screenshot is taking. 500 to 1000 milliseconds is often sufficient.

Command Line Options
-----------------

| Argument                 | Description |
| :----------------------- | :---------- |
| <pre>-b, --base</pre>    | The base URL value. If set then the URL will be appended to this value. |
| <pre>-c, --config</pre>  | The name of the JSON config file to use to get the screenshots. If this is set all other arguments are ignored. |
| <pre>-d, --dir</pre>     | The directory relative to where the script is run to output the screenshots to. |
| <pre>-D, --delay</pre>   | The number of milliseconds to delay after loading before taking a picture of the page. Can't be larger than 30000. |
| <pre>-f, --fit</pre>     | Fit the screenshot to the provided height and width. |
| <pre>-h, --height</pre>  | Integer height of the viewport to take the screenshot in. Use `--fit` if you want the screenshot to only capture the viewport width and height. Defaults to `900`. |
| <pre>--jpg</pre>         | Set the image type for screenshots to be `jpg`. Alternate method to using `-t`. |
| <pre>-n, --name</pre>    | The name of the file to save the screenshot as. It can also be a [name format](#dynamic-file-names) that will be used to build the filename for each screenshot. If you're not setting a name format, then the name only applies to the first URL so it's only useful if getting just one screenshot. |
| <pre>--png</pre>         | Set the image type for screenshots to be `png`. Alternate method to using `-t`. |
| <pre>-s, --size</pre>    | A viewport size to capture the screenshot in. The format is `WIDTHxHEIGHT`. For example, `800x400` for a width of 800px and a height of 400px. Use `--fit` if you want the screenshot to only capture the viewport width and height. |
| <pre>-t, --type</pre>    | The file type to use for the screenshots. `jpg` or `png`. Defaults to `jpg`. |
| <pre>-q, --quality</pre> | The quality of the jpg image, between 0-100. Not applicable to png image. Defaults to `100`. |
| <pre>-u, --url</pre>     | URL to get the screenshot of. You can specify this parameter multiple times to get a screenshot of multiple web pages. |
| <pre>-w, --width</pre>   | Integer width of the viewport to take the screenshot in. Defaults to `1300`. |
| <pre>-v, --version</pre> | Output the version number. |
| <pre>--clipH</pre>       | The height of the clip area. |
| <pre>--clipW</pre>       | The width of the clip area. |
| <pre>--clipX</pre>       | The x-coordinate of top-left corner of clip area. |
| <pre>--clipY</pre>       | The y-coordinate of top-left corner of clip area. |


Command line examples
-----------------

Usage

```
page-shots [options]
```

### Get a screenshot of just one URL and output it in the same directory.

```
page-shots -u https://www.aptuitiv.com
```

### Get a screenshot of just one URL and specify the directory and file name.

```
page-shots -u https://www.aptuitiv.com -d screenshots -n home
```

### Get a screenshot of just one URL and specify the directory and file name. The file will be saved as a "png" because of the file name extension.

```
page-shots -u https://www.aptuitiv.com -d screenshots -n home.jpg
```

### Specify a file name format

```
page-shots -u https://www.aptuitiv.com -n home-{width}
```

### Specify a file name format and set the image to be a png based on the file name

```
page-shots -u https://www.aptuitiv.com -n home-{width}.png
```

### Get screenshots for multiple URLs and save to a specific directory.

```
page-shots -u https://www.aptuitiv.com -u https://www.aptuitiv.com -d screenshots
```

### Set a base URL and get a screenshot of multiple URLs in the same website.

```
page-shots -b https://www.aptuitiv.com -u /pricing -u / -u /docs
```

### Save the screenshot as a png image.

```
page-shots -u https://www.aptuitiv.com -t png
```

### Change the image quality for the jpg screenshot to 80.

```
page-shots -u https://www.aptuitiv.com -q 80
```

### Capture a smaller screen size to simulate a mobile device.

```
page-shots -u https://www.aptuitiv.com -w 415
```

### Get a screenshot at a specific height and width.

```
page-shots -u https://www.aptuitiv.com -w 1200 -h 800 --fit
```

### Set the screenshot size using the `size` argument.

The `size` argument requires that both the width and height be set. Use this format:

`WIDTHxHEIGHT`

There should not be a space between the width, the "x", and the height.

Set the width to be 1000px and the height to be 600px.

```
page-shots -u https://www.aptuitiv.com -s 1000x600
```

### Set multiple screenshot sizes.

The following will set the following screenshot sizes:

- 1000px width and 600px height
- 600px width and 600px height
- 400px width and 800px height


> Because the `--fit` parameter is not set only the width actually applies to the screenshot.

```
page-shots -u https://www.aptuitiv.com -s 1000x600 -s 600x600 -s 400x800
```

### Delay for 3 seconds after loading the page before taking the screenshot

```
page-shots -u https://www.aptuitiv.com -w 1200 --delay 3000
```

### Capture just a clip on the page 100px down from the top that is 900px wide and 400px tall.

```
page-shots -u https://www.aptuitiv.com -w 1200 --clipH 400 --clipW 900 --clipX 0 --clipY 100
```


Use a JSON file to specify one or more URLs and configuration
-----------------

Instead of specifying the URLs to get sreenshots for and their configuration through the [command line options](#command-line-options) you can do all of that in JSON file.
This is the recommended method if you are getting screenshots for multiple URLs at one time.

Below is an example JSON file:

```
{
    "name": "{url}-{width}-{height}.png",
    "urls": [
        "https://www.aptuitiv.com",
        "https://www.aptuitiv.com/pricing",
        "https://www.aptuitiv.com"
    ],
    "sizes": [
        "1200x800",
        "800x800",
        "420x700"
    ]
}
```

The above specifies 3 URLs to get screenshots for and 3 different viewport sizes to save each screenshot as.

> **NOTE: The contents of the JSON file needs to be valid JSON. Use double quotes instead of single quotes.**

Validate your JSON at [jsonlint.com](https://jsonlint.com/) if you're having any troubles.

### JSON Options

Below is a description of each of the JSON keys that you can set values for.

Only the `urls` value is actually required. If the others aren't set then the default values will be used.

| Name       | Description  |
| :--------- | ------------ |
| baseUrl    | The base URL value. If set then each URL will be appended to this value. If it's not set then it's not used and each URL should be the full URL. |
| clip       | The X, Y, width, and height of a clip to capture instead of the full screen or specified width and height. It would be an object. For example: `"clip": {x 0, y: 100, w: 800, h: 400}` |
| delay      | The number of milliseconds to delay after loading before taking a picture of the page. |
| dir        | The directory relative to where the script is run to output the screenshots to. |
| height     | Integer height of the viewport to take the screenshot in. Use `"fit": true` if you want the screenshot to only capture the viewport width and height. Defaults to `900` if no sizes are set. |
| fit        | Whether or not to fit the the screenshot to the provided height and width. |
| full       | Whether or not to have the screenshot capture the full width and height of the page. |
| name       | The [name format](#dynamic-file-names) to use to build the file name for each screenshot. Defaults to `{url}-{width}` if not set. |
| quality    | The quality of the jpg image, between 0-100. Not applicable to png image. Defaults to `100`. |
| sizes      | An array of viewport sizes to get the screenshots in. Defaults to `1300x900` if not set.|
| type       | The file type to use for the screenshots. `jpg` or `png`. Defaults to `jpg` if not set. |
| urls       | An array of URLs to get screenshots for. You can either set each one as a string, or they can be a JSON object overriding configuration options for each URL. |
| width      | Integer width of the viewport to take the screenshot in. Defaults to `1300` if no sizes are set. |


### Minimum JSON file

The minimum data that you need in the JSON file is the `urls`. All the other values have defaults.

Below is the bare minimum necessary in the JSON file.

```
{
    "urls": [
        "https://www.aptuitiv.com"
    ]
}
```


### Initialize the JSON file

A utility command can be used to generate a boilerplate JSON file.

```
page-shots init
```

By default the JSON file will be built in the same directory that you're accessing on the command line. And by default the file name will be `shots.json`.

You can specify your own name for the JSON file by passing a value after the `init` command.

```
page-shots init myfile.json
```

Note, you don't have to specify the `.json` file extension. If the extension is not set or it's not equal to "json" then `.json` is added as the file extension. 

```
page-shots init myfile
```

The above is the same as:

```
page-shots init myfile.json
```

### Use the JSON configuration file

There are two ways to use the JSON configuration file.

1. Simply run `page-shots` on the command line with no arguments. In this case the program will look for a file called `shots.json` in the current directory.
2. Specify the name of the JSON file to use.

#### Specify the name of the JSON file to use

Use the `-c` or `--config` argument to specify the JSON config file to use. If you use this argument any other arguments are ignored.

```
page-shots -c myfile.json
```

When specifying the name of the JSON config file you don't have to include the `.json` extension. If the extension of the file is not `.json` then it's automatically added.

```
page-shots -c myfile
```

### Sample JSON

Below is an example of all of the available options.

You wouldn't use all of the options as some of them override other options. For example, you wouldn't set `sizes`, `width` and `height` because `sizes` override `width` and `height`. Also, `fit` and `full` do essentially the same thing.

```
{
    "baseUrl": "https://www.aptuitiv.com",
    "clip": {"x": 20, "y": 105, "w": 800, "h": 400},
    "delay": 400,
    "dir": "screenshots",
    "height": 900,
    "fit": true,
    "full": false,
    "name": "site-{url}-{width}-{height}-{fit}",
    "quality": 80,
    "sizes": [
        "1500x1200",
        "1000x800",
        {
            "width": 600,
            "height": 500
        },
        {
            "width": 400,
            "height": 400,
            "fit": true,
            "name": "small-{stub}-{quality}",
            "quality": 80,
            "type": "png"
        },
        {
            "width": 800,
            "height": 400,
            "full": false,
            "dir": "medium",
            "key": "medium-shot",
            "delay": 1500,
            "name": "med-{stub}.png"
        }
    ],
    "type": "jpg",
    "urls": [
        "/",
        "/contact",
        "https://www.google.com",
        {
            "url": "/pricing",
            "delay": 0,
            "dir": "pricing-screenshots",
            "height": 400,
            "fit": false,
            "full": true,
            "name": "pricing-{width}.jpg",
            "quality": 70,
            "sizes": [
                "1200x800",
                {
                    "width": 800,
                    "height": 400,
                    "fit": true
                }
            ],
            "type": "jpg",
            "width": 1400
        }
    ],
    "width": 1000
}
```

As you can see in the above example both `sizes` and `urls` can be used to override configuration values.

If you use a JSON object for a size then you can also specify if the screenshot should fit the height and width. This can be done by using the `fit` or `full` option.

If you use a JSON object for a URL then you can override all other options for that individual URL.

If you use the `baseUrl` option but your `url` value starts with `https://` or `http://` then the `baseUrl` value will not be used for that URL.


### Overriding configurations with the `sizes` values

If you use a JSON object for an individual size then you can override some of the configuration values for that individual size.

Below are the values that you can override in the size object

- delay
- dir
- fit
- full
- name
- quality
- type
  
You can also set the `key` value to specify a name for the size that can be used to replace the `{size}` placeholder in the [dynamic file name](#dynamic-file-names).

See the [sample JSON](#sample-json) above for an example of how this is done.

### Overriding configurations with the `urls` values

If you use a JSON object for an individual URL then you can override some of the configuration values for that individual URL.

> If you also [override configuration values with an individual size](#overriding-configurations-with-the-sizes-values) then those values will override the URL values.

Below are the values that you can override in the URLs object.

- delay
- dir
- height
- fit
- full
- name
- quality
- sizes
- type
- width

See the [sample JSON](#sample-json) above for an example of how this is done.

License
-----------------

Page Shots is licensed under the [MIT][info-license] license.


[node]: http://nodejs.org/

[info-license]: LICENSE
[shield-license]: https://img.shields.io/badge/license-MIT-blue.svg

[info-node]: package.json
[shield-node]: https://img.shields.io/badge/node.js%20support-8-brightgreen.svg

[info-npm]: https://www.npmjs.com/package/page-shots
[shield-npm]: https://img.shields.io/npm/v/page-shots.svg

[info-build]: https://travis-ci.org/erictompkins/page-shots
[shield-build]: https://img.shields.io/travis/erictompkins/page-shots/master.svg




