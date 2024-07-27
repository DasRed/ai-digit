import fs from 'fs';
import {glob} from 'glob';
import logger from '../../logger.js';

let runCount = 0;

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {directory, onlyRunOnce = true}) {
    if (onlyRunOnce === true && runCount > 0) {
        return image;
    }
    clear(directory)

    runCount++;

    return image;
}

export async function clear(directory) {
    const files = await glob(`${directory}/**/*.{png,jpeg,jpg,json,json5,gif}`);
    logger.trace(`${files.length} files found to delete`);
    await Promise.all(files.map((file) => {
        logger.trace(`Deleting file ${file}`);
        return fs.promises.unlink(file);
    }));
}