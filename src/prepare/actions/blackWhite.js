import sharp from 'sharp';
import clone from '../../lib/sharp/clone.js';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {format, options}, {meta}) {
    const imageClone = await clone(image);

    const array = await imageClone.raw().toArray();
    let data    = Array.from(array[0]);
    const max   = Math.max(...data);
    const min   = Math.min(...data);
    data        = data.map((value) => {
        const deltaMin = value - min;
        const deltaMax = max - value;
        if (deltaMin < deltaMax) {
            return 0;
        }
        return 255;
    });

    const imageNew = sharp(Buffer.from(data), {
        raw: {
            width:    meta.width,
            height:   meta.height,
            channels: meta.channels,
        }
    }).toColorspace('b-w');

    return imageNew.toFormat(format, options);
}