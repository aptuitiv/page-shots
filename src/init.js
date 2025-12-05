import { createWriteStream } from 'fs';
import { extname, join } from 'path';
import chalk from 'chalk';
import sanitize from 'sanitize-filename';
import ora from 'ora';

/**
 * Initialize the JSON file used to configure the URLs to get screenshots of
 */
const initJson = {
    /**
     * The name of the directory to save the file in
     *
     * @type {string}
     */
    dir: '',

    /**
     * The name of the file to save the JSON file as
     *
     * @type {string}
     */
    filename: 'shots.json',

    /**
     * Set the name of the directory to save the file in
     *
     * @param {string} dir The name of the diectory to save the file in
     */
    setDir(dir) {
        if (typeof dir === 'string') {
            let directory = dir.trim();
            if (directory.length > 1) {
                if (directory.substring(directory.length - 1) !== '/') {
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
        const ext = extname(name).toLowerCase().replace('.', '');
        let filename = name;
        if (ext !== 'json') {
            filename += '.json';
        }
        filename = sanitize(filename, { replacement: '-' })
        this.filename = filename;
    },

    /**
     * Builds and saves the json file
     */
    build() {
        const json = {
            baseUrl: '',
            name: '{url}-{width}',
            type: 'jpg',
            urls: [],
            sizes: [
                '1300x800'
            ]
        }
        const filePath = join(this.dir, this.filename),
            spinner = ora({ text: `Creating ${this.filename}`, spinner: 'arc' }).start();

        const writeStream = createWriteStream(filePath, { flags: 'w' });
        writeStream.write(JSON.stringify(json, null, 4));
        writeStream.close();
        spinner.succeed(chalk.green(`${this.filename} created`));
    }
}

export default initJson;