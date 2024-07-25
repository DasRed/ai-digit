/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {options}) {
    return image.toFormat('gif').gif(options);
}