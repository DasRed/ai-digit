import fs from 'fs';
import clone from '../../../lib/sharp/clone.js';
import template from './template/json5.js';

/**
 *
 * @param {Sharp} image
 * @param file
 * @param type
 * @param colorspace
 * @returns {Promise<boolean>}
 */
export default async function (image, file, {colorspace = 'srgb', invert = true}, info) {
    const imageClone = await clone(image);
    const array      = await imageClone.toColorspace(colorspace).raw().toArray();
    let data         = Array.from(array[0]);
    const min        = Math.min(...data);
    const max        = Math.max(...data) - min;

    data = data.map((value) => {
        value = (value - min) / max;
        return invert ? 1 - value : value;
    });

    fs.writeFileSync(file, template(data, info, invert));

    return true;
}