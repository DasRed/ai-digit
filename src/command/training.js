import brain from 'brain.js';
import fs from 'fs';
import {glob} from 'glob';
import sharp from 'sharp';
import logger from '../logger.js';

export default async function ({input, output, overwrite}) {
    logger.trace({msg: 'Starting training with', input, output});

    // find all file, which should be converted
    logger.trace(`reading directory from ${input}`);
    const files = await glob(`${input}/**/*.{png,jpeg,jpg}`);
    logger.debug(`found ${files.length} files for training`);

    const data = await files.reduce(async (promise, fileSource) => {
        const data = await promise;

        // prepare some information for the file
        const fileName = fileSource.split('/').slice(-1).shift().split('.').slice(-2).shift();
        const number   = fileSource.split('/').slice(-2).shift();
        logger.trace({msg: `using`, number, fileName});

        // create sharp
        logger.trace(`loading image ${fileSource}`);
        const image = sharp(fileSource);

        const input = await image.raw().toArray();
        data.push({input: Array.from(input[0]), output: [number]});
        return data;
    }, Promise.resolve([]));

    logger.debug(`Writing training data to ${output}`);
    fs.writeFileSync(output, JSON.stringify(data, null, 4));
    logger.debug(`Training data written to ${output}`);
}
