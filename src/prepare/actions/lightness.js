/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {value}) {
    return image.modulate({lightness: value});
}