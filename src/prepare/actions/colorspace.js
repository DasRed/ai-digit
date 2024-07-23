/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {value}) {
    return image.toColorspace(value);
}