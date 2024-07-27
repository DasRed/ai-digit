import sharp from 'sharp';
import clone from '../../lib/sharp/clone.js';

/**
 *
 * @param {Sharp} image
 * @returns {Promise<Sharp>}
 */
export default async function (image, {format, autoCrop = true, options}, {fileSource, meta}) {
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

    let imageNew = sharp(Buffer.from(data), {
        raw: {
            width:    meta.width,
            height:   meta.height,
            channels: meta.channels,
        }
    })
        .toColorspace('b-w')
        .toFormat(format, options);

    if (autoCrop === true) {
        data = data.reduce((acc, value, index) => {
            if (index % meta.channels === 0) {
                acc.push(value);
            }
            return acc;
        }, []);

        const rect = findCropArea(data, meta, fileSource);

        imageNew = await clone(imageNew.extract(rect));
        imageNew.toColorspace('b-w').toFormat(format, options);
    }

    return imageNew;
}

export function findCropArea(data, meta, fileSource) {
    const rect = data.reduce((acc, value, index) => {
        if (value > 0) {
            return acc;
        }

        const x = index % meta.width;
        const y = Math.floor(index / meta.width);

        acc.x1 = Math.min(acc.x1, x);
        acc.y1 = Math.min(acc.y1, y);
        acc.x2 = Math.max(acc.x2, x);
        acc.y2 = Math.max(acc.y2, y);

        return acc;
    }, {x1: meta.width, y1: meta.height, x2: 0, y2: 0});

    return {left: rect.x1, top: rect.y1, width: rect.x2 - rect.x1 + 1, height: rect.y2 - rect.y1 + 1};
}