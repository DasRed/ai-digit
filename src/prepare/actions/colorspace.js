import clone from '../../lib/sharp/clone.js';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {value}) {
    return image.toColorspace(value);
}