/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {lower, upper}) {
    return image.normalise(lower, upper);
}