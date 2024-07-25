import {glob} from 'glob';
import {basename, dirname} from 'path';
import {fileURLToPath} from 'url';

export default async function (importMetaUrl) {
    const __file    = fileURLToPath(importMetaUrl);
    const __dirname = dirname(fileURLToPath(importMetaUrl));
    const files     = await glob(`${__dirname}/*.js`);
    return files.reduce(async (promise, file) => {
        const result = await promise;

        if (file === __file) {
            return result;
        }

        const imported = await import(file);

        return {...result, [basename(file, '.js')]: imported.default};
    }, Promise.resolve({}));

}