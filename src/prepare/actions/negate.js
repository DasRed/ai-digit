/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {alpha = true}) {
    return image.negate({alpha});
}