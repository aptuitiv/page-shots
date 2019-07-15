/**
 * Command line interface
 */
const program = require('commander'),
    pkg = require('../package.json'),
    main = require('./main'),
    pageShots = main.pageShots;


/**
 * Collect multiple parameter values into one array
 * @param {string} val 
 * @param {array} values 
 */
function collect(val, values) {
    values.push(val);
    return values;
}

// Set up command line arguments
program
  .version(pkg.version, '-v, --version')
  .description(pkg.description)
  .option('-b, --base <string>', 'The base URL value. If set then the URL will be appended to this value.')
  .option('-d, --dir <string>', 'The directory relative to where the script is run to output the screenshots to.')
  .option('-D, --delay <integer>', 'The number of milliseconds to delay after loading before taking a picture of the page.')
  .option('-f, --fit', 'Fit the screenshot to the provided height and width.')
  .option('-H, --height <integer>', 'Integer height of the viewport to take the screenshot in. Use "--fit" if you want the screenshot to only capture the viewport width and height.', 900)
  .option('--jpg', 'Set the image type for screenshots to be "jpg". Alternate method to using -t.')
  .option('-n, --name <string>', 'The name of the file to save the screenshot as. Only applies to the first URL.')
  .option('--png', 'Set the image type for screenshots to be "png". Alternate method to using -t.')
  .option('-q, --quality <integer>', 'The quality of the jpg image, between 0-100. Not applicable to png image.', 100)
  .option('-s, --size <string>', 'A viewport size to capture the screenshot in. The format is WIDTHxHEIGHT. For example, 800x400 for a width of 800px and a height of 400px. Use "--fit" if you want the screenshot to only capture the viewport width and height.', collect, [])
  .option('-t, --type <string>', 'The file type to use for the screenshots. "jpg" or "png"', 'jpg')
  .option('-u, --url <string>', 'URL to get the screenshot of.', collect, [])
  .option('-W, --width <integer>', 'Integer width of the viewport to take the screenshot in.', 1300)
  .option('--clipH <integer>', 'The height of clip area.')
  .option('--clipW <integer>', 'The width of clip area.')
  .option('--clipX <integer>', 'The x-coordinate of top-left corner of clip area.')
  .option('--clipY <integer>', 'The y-coordinate of top-left corner of clip area.');

// Output some additional examples
program.on('--help', function() {
    console.log('');
    console.log('Examples:')
    console.log('  page-shots -d images -u https://www.mysite.com');
    console.log('  page-shots -u https://www.mysite.com -u https://www.mysite.com/page');
    console.log('  page-shots -d images -u https://www.mysite.com -w 900');
    console.log('  page-shots -d images -u https://www.mysite.com -w 900 -q 80');
    console.log('  page-shots -d images -u https://www.mysite.com -w 900 -t png');
    console.log('  page-shots -d images -u https://www.mysite.com -w 450 -h 800 --fit');
    console.log('');
});

program.parse(process.argv);

/**
 * Main function to run the CLI
 */
async function cli() {
    try {
        // Initialize pageShots
        await pageShots.init();

        // Handle the arguments
        if (program.base) {
            pageShots.setBaseUrl(program.base);
        }
        if (program.dir) {
            pageShots.setDir(program.dir);
        }
        if (program.url) {
            pageShots.addUrl(program.url);
        }
        if (program.height) {
            pageShots.setHeight(program.height);
        }
        if (program.width) {
            pageShots.setWidth(program.width);
        }
        if (program.fit) {
            pageShots.setFullScreen(false);
        }
        if (program.type) {
            pageShots.setFileType(program.type);
        }
        if (program.png) {
            pageShots.setFileType('png');
        }
        if (program.jpg) {
            pageShots.setFileType('jpg');
        }
        if (program.quality) {
            pageShots.setQuality(program.quality);
        }
        if (program.delay) {
            pageShots.setDelay(program.delay);
        }
        if (program.size) {
            pageShots.addSize(program.size);
        }
        if (
            typeof program.clipX !== 'undefined' 
            && typeof program.clipY !== 'undefined'
            && typeof program.clipW !== 'undefined' 
            && typeof program.clipH !== 'undefined'
        ) {
            pageShots.setClip(program.clipX, program.clipY, program.clipW, program.clipH);
        }
        if (program.name) {
            pageShots.setName(program.name);
        }
        pageShots.run();
    } catch (err) {
        await pageShots.die();
        console.log(err);
    }
}

/**
 * Output any unhandled rejections
 */
process.on('unhandledRejection', function(err) {
    console.log('----- ERROR ------');
    console.log(err);
});

exports.cli = cli;