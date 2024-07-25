import fs from 'fs';
import clone from '../../../lib/sharp/clone.js';

/**
 *
 * @param {Sharp} image
 * @param file
 * @param type
 * @param colorspace
 * @returns {Promise<boolean>}
 */
export default async function (image, file, {type = 'array', colorspace = 'srgb'}) {
    const imageClone = await clone(image);
    const array      = await imageClone.toColorspace(colorspace).raw().toArray();
    let data         = Array.from(array[0]);
    const max        = Math.max(...data);

    data = data.map((value) => value / max);

    switch (type) {
        case 'string':
            data = data.join('');
            break;

        default:
        case 'array':
            break;
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 4));

    return true;
}