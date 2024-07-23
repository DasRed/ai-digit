/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {kernel}) {
    return image.convolve(kernel);
}