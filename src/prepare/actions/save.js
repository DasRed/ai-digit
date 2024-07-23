import fs from 'fs';
import sharp from 'sharp';
import logger from '../../logger.js';
import saves from './save/index.js';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {as, file, overwrite = true}, {number, fileName, position}) {
    if (saves[as] === undefined) {
        logger.error(`Save type ${type} does not exists`);
        return image;
    }

    file = file.replace('{number}', number).replace('{fileName}', fileName).replace('{position}', position);

    // if the destination file exits and overwrite is disabled
    if (overwrite === false && fs.existsSync(file) === true) {
        logger.warn(`can not handle file ${file}, because destination file ${file} exists!`);
        return image;
    }

    const buffer = await image.toBuffer({resolveWithObject: true});
    await saves[as](sharp(buffer.data), file);

    logger.trace(`file ${file} saved.`);

    return image;
}