/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {width, height, options}, {meta}) {
    return image.resize(Number(width), Number(height), options)
                .toColorspace(meta.space);
}