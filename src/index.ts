#! /usr/bin/env node

// Packages
import { Command, Option } from 'commander';
import fs from 'fs-extra';
import path, { extname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

// Library
import { ConfigParser, maxDelay } from './config.js';
import { logError, logSuccess } from './lib/log.js';
import init from './init.js';
import screenshotHandler from './screenshot.js';
import { isStringWithValue } from './lib/types.js';
import { ConfigParam } from './types.js';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get the current package.json information
const thisPackageJson = fs.readJsonSync(
    path.resolve(__dirname, '../package.json')
);

// const doScreenshots = async (
//     configParser: ConfigParser,
//     options: ConfigParam,
//     screenshot: Screenshot
// ): Promise<void> =>
//     new Promise<void>((resolve, reject) => {
//         console.log('Doing screenshots for: ', options);
//         configParser.parse(options);
//         if (configParser.hasUrls()) {
//             screenshot
//                 .getScreenshots(configParser.getConfig())
//                 .then(() => {
//                     logSuccess('All screenshots have been taken.');
//                     resolve();
//                 })
//                 .catch((err) => {
//                     logError('Error getting screenshots: ', err);
//                     reject(err);
//                 });
//         } else {
//             logError(
//                 'No URLs were provided to get screenshots of. Nothing to do.'
//             );
//         }
//     });

// Set up the command line options
const program = new Command();

// Set up command line arguments
program
    .version(thisPackageJson.version)
    .description(thisPackageJson.description)
    .option(
        '-b, --base <string>',
        'The base URL value. If set then the URL will be appended to this value.'
    )
    .option('--clipH <integer>', 'The height of clip area.')
    .option('--clipW <integer>', 'The width of clip area.')
    .option(
        '--clipX <integer>',
        'The x-coordinate of top-left corner of clip area.'
    )
    .option(
        '--clipY <integer>',
        'The y-coordinate of top-left corner of clip area.'
    )
    .option(
        '-c, --config <string...>',
        'The name of the JSON config file to use to get the screenshots. If this is set all other arguments are ignored.'
    )
    .option(
        '-D, --delay <integer>',
        `The number of milliseconds to delay after loading before taking a picture of the page. Can not be greater than ${maxDelay}.`
    )
    .option(
        '-d, --dir <string>',
        'The directory relative to where the script is run to output the screenshots to.'
    )
    .option('-f, --fit', 'Fit the screenshot to the provided height and width.')
    .option(
        '-F, --fullScreen <boolean>',
        'Whether or not to have the screenshot capture the full width and height of the page.',
        true
    )
    .option(
        '-h, --height <integer>',
        'Integer height of the viewport to take the screenshot in. Use "--fit" if you want the screenshot to only capture the viewport width and height.',
        '900'
    )
    .option(
        '--hideSelector <string...>',
        'The CSS selector of the element(s) to hide during the screenshot process. The elements are hidden before any screenshot or scrolling is done.'
    )
    .option(
        '--hideStitchSelector <string...>',
        'The CSS selector of the element(s) to hide during the screenshot process if screenshots are stitched together. The elements are hidden after the first scroll. Common usage is to hide a sticky header or floating element.'
    )
    .option(
        '--jpg',
        'Set the image type for screenshots to be "jpg". Alternate method to using --type.'
    )
    .option(
        '-n, --name <string>',
        'The name of the file to save the screenshot as. Only applies to the first URL.'
    )
    .option(
        '--pixelRatio <number>',
        'The device pixel ratio to use for the screenshot. Default is 1.'
    )
    .option(
        '--png',
        'Set the image type for screenshots to be "png". Alternate method to using -t.'
    )
    .option(
        '-q, --quality <integer>',
        'The quality of the jpg image, between 0-100. Not applicable to png image.',
        '100'
    )
    .option(
        '-s, --size <string...>',
        'A viewport size to capture the screenshot in. The format is WIDTHxHEIGHT. For example, 800x400 for a width of 800px and a height of 400px. Use "--fit" if you want the screenshot to only capture the viewport width and height.',
        []
    )
    .option(
        '--scrollDelay <integer>',
        'The number of milliseconds to delay after each scroll to allow the content to load. This is used to allow time for lazy loading of images or animations that are triggered by the scroll to complete.',
        '400'
    )
    .option(
        '--stitchThreshold <integer>',
        "This determines the maximum pixel height of the screenshot that can be taken natively before falling back to stitching screenshots together. It's based on the maximum texture size supported by Chromium's software GL backend. Visit https://webglreport.com/ in Chrome and check the 'Max Texture Size' value to see the maximum texture size supported by the browser.",
        '16000'
    )
    .addOption(
        new Option(
            '-t, --type <string>',
            'The file type to use for the screenshots.'
        )
            .choices(['jpg', 'png', 'webp'])
            .default('jpg')
    )
    .option('-u, --url <string...>', 'URL to get the screenshot of.', [])
    .option(
        '-w, --width <integer>',
        'Integer width of the viewport to take the screenshot in.',
        '1300'
    )
    .addOption(
        new Option(
            '--waitUntil <string>',
            'The wait until value to use for the page.'
        ).choices(['domcontentloaded', 'load', 'networkidle0', 'networkidle2'])
    )
    .option(
        '--webp',
        'Set the image type for screenshots to be "webp". Alternate method to using -t.'
    )
    .action(async (options) => {
        await screenshotHandler(options);
        logSuccess('END OF SCRIPT: All screenshots have been taken.');
        // Set up the screenshot class
        // const screenshot = new Screenshot();
        // await screenshot.init();

        // const configParser = new ConfigParser();
        // let configFiles = [];
        // if (isStringWithValue(options.config)) {
        //     configFiles = globSync(options.config);
        //     console.log('Config files: ', options.config, configFiles);
        // }

        // if (configFiles.length > 0) {
        //     configFiles.forEach((file) => {
        //         try {
        //             let configFile = 'shots.json';
        //             if (typeof file === 'string' && file.length > 0) {
        //                 configFile = file;
        //                 const ext = extname(file)
        //                     .toLowerCase()
        //                     .replace('.', '');
        //                 if (ext.length === 0) {
        //                     configFile += '.json';
        //                 }
        //             }
        //             if (fs.existsSync(configFile)) {
        //                 doScreenshots(
        //                     configParser,
        //                     fs.readJsonSync(configFile),
        //                     screenshot
        //                 );
        //             } else {
        //                 logError(
        //                     `The JSON config file "${configFile}" could not be found`
        //                 );
        //             }
        //         } catch (err) {
        //             logError(
        //                 `Error while processing the JSON config file ${file}`,
        //                 err
        //             );
        //             process.exit();
        //         }
        //     });
        // } else {
        //     doScreenshots(configParser, options, screenshot);
        // }

        // configParser.setProcessConfigFile();
        // configParser.parse(options);
        // if (configParser.hasUrls()) {
        //     getScreenshots(configParser.getConfig())
        //         .then(() => {
        //             logSuccess('All screenshots have been taken.');
        //         })
        //         .catch((err) => {
        //             logError('Error getting screenshots: ', err);
        //         });
        // } else {
        //     logError(
        //         'No URLs were provided to get screenshots of. Nothing to do.'
        //     );
        // }
    });

// Custom help output
program.addHelpText(
    'after',
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

// Set up the initialization action to create the JSON config file.
program
    .command('init [file]')
    .description(
        'Initialize the JSON file that is used to configure the URLs to get screenshots of.'
    )
    .action((file) => {
        init.setDir(process.cwd());
        if (file) {
            init.setFilename(file);
        }
        init.build();
    });

// Parse the command line arguments
program.parse();
