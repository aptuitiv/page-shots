#! /usr/bin/env node

// Packages
import { Command, Option } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Library
import { ConfigParser, maxDelay } from './config.js';
import { logError, logSuccess } from './lib/log.js';
import init from './init.js';
import getScreenshots from './screenshot.js';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get the current package.json information
const thisPackageJson = fs.readJsonSync(
    path.resolve(__dirname, '../package.json')
);

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
        '-c, --config <string>',
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
    .action((options) => {
        const configParser = new ConfigParser();
        configParser.setProcessConfigFile();
        configParser.parse(options);
        if (configParser.hasUrls()) {
            getScreenshots(configParser.getConfig())
                .then(() => {
                    logSuccess('All screenshots have been taken.');
                })
                .catch((err) => {
                    logError('Error getting screenshots: ', err);
                });
        } else {
            logError(
                'No URLs were provided to get screenshots of. Nothing to do.'
            );
        }
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
