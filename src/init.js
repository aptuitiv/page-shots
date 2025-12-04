import { createWriteStream } from 'fs';
import { extname, join } from 'path';
import chalk from 'chalk';
import sanitize from 'sanitize-filename';
import ora from 'ora';

/**
 * Initialize the JSON file used to configure the URLs to get screenshots of
 */
class InitJson {
    /**
     * Constructor
     */
    constructor() {
        this.dir = '';
        this.filename = 'shots.json';
    }

    /**
     * Set the name of the directory to save the file in
     *
     * @param {string} dir The name of the diectory to save the file in
     */
    setDir(dir) {
        if (typeof dir === 'string') {
            dir = dir.trim();
            if (dir.length > 1) {
                if (dir.substring(dir.length - 1) !== '/') {
                    dir = `${dir}/`;
                }
                this.dir = dir;
            }
        }
    }

    /**
     * Set the file name for the JSON file
     *
     * @param {string} name The filename for the JSON file
     */
    setFilename(name) {
        const ext = extname(name).toLowerCase().replace('.', '');
        if (ext !== 'json') {
            name += '.json';
        }
        name = sanitize(name, { replacement: '-' })
        this.filename = name;
    }

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

const init = new InitJson();
export default init;