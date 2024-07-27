/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {channel}) {
    return image.extractChannel(channel);
}