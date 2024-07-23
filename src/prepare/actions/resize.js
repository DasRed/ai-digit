/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {width, height, options}) {
    return image.resize(width, height, options);
}