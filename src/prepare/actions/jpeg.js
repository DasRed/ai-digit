/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {options}) {
    return image.toFormat('jpeg').jpeg(options);
}