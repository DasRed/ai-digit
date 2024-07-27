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
export default async function (image, file, {colorspace = 'srgb'}, info) {
    const imageClone = await clone(image);
    const array      = await imageClone.toColorspace(colorspace).raw().toArray();
    let data         = Array.from(array[0]);
    const max        = Math.max(...data);

    data = data.map((value) => 1 - value / max);

    fs.writeFileSync(file, template(data, info));

    return true;
}