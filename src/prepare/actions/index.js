import {glob} from 'glob';
import {basename, dirname} from 'path';
import {fileURLToPath} from 'url';

const __file = fileURLToPath(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const files   = await glob(`${__dirname}/*.js`);
const actions = await files.reduce(async (promise, file) => {
    const result = await promise;

    if (file === __file) {
        return result;
    }

    const action = await import(file);

    return {...result, [basename(file, '.js')]: action.default};
}, Promise.resolve({}));

export default actions;