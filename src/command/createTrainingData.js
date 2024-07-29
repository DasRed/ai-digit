import fs from 'fs';
import {glob} from 'glob';
import JSON5 from 'json5';
import logger from '../logger.js';

export default async function ({input, output, overwrite}) {
    logger.trace({msg: 'Starting creation of training data with', input, output});

    // if the destination file exits and overwrite is disabled
    if (overwrite === false && fs.existsSync(output) === true) {
        logger.warn(`can not handle file ${output}, because destination file ${output} exists!`);
        return;
    }

    // find all file, which should be converted
    logger.trace(`reading directory from ${input}`);
    const files = await glob(`${input}/**/*.json5`);
    logger.debug(`found ${files.length} files for training`);

    const result = files.reduce((result, fileSource) => {
        // create sharp
        logger.trace(`loading ${fileSource}`);
        const data = JSON5.parse(fs.readFileSync(fileSource, 'utf-8'));
        result.push({input: data.array, output: {[data.number]: 1}});

        return result;
    }, []);

    logger.debug(`Writing training data to ${output}`);
    fs.writeFileSync(output, JSON.stringify(result, null, 4));
    logger.info(`Training data written to ${output}`);
}
