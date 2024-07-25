import fs from 'fs';
import logger from '../../logger.js';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {}, {fileSource}) {
    fs.unlinkSync(fileSource);
    logger.trace(`Source file ${fileSource} deleted`);

    return image;
}