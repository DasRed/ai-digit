/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {threshold, options}) {
    return image.threshold(threshold, options);
}