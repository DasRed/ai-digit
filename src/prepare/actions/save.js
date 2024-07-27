import fs from 'fs';
import clone from '../../lib/sharp/clone.js';
import logger from '../../logger.js';
import saves from './save/index.js';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {as, file, overwrite = true, options = {}}, info) {
    if (saves[as] === undefined) {
        logger.error(`Save type ${info.type} does not exists`);
        return image;
    }

    file = file.replace('{number}', info.number).replace('{fileName}', info.fileName).replace('{position}', info.position);

    // if the destination file exits and overwrite is disabled
    if (overwrite === false && fs.existsSync(file) === true) {
        logger.warn(`can not handle file ${file}, because destination file ${file} exists!`);
        return image;
    }

    await saves[as](await clone(image), file, options, info);
    logger.trace(`file ${file} saved.`);

    return image;
}