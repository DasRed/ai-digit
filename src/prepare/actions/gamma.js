/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {gamma, gammaOut}) {
    return image.gamma(gamma, gammaOut);
}