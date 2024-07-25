import sharp from 'sharp';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image) {
    const meta   = await image.metadata();
    const buffer = await image.toBuffer({resolveWithObject: true});

    return sharp(buffer.data).toColorspace(meta.space);
}