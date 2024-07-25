/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {options}, {meta}) {
    return image.toFormat('png').png(options).toColorspace(meta.space);
}