import logger from '../../logger.js';

/**
 *
 * @param {Sharp} image
 * @param coordinateStart
 * @param positions
 * @param position
 * @returns {Promise<Sharp>}
 */
export default async function (image, {coordinateStart}, {rect}) {
    // create sharp and extract area
    logger.trace(`cropping image`);
    return image.extract(rect);
}