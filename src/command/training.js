import brain from 'brain.js';
import fs from 'fs';
import {glob} from 'glob';
import logger from '../logger.js';

export default async function ({input, output, overwrite, ai}) {
    logger.trace({msg: 'Starting training with', input, output});

    // if the destination file exits and overwrite is disabled
    if (overwrite === false && fs.existsSync(output) === true) {
        logger.warn(`can not handle file ${output}, because destination file ${output} exists!`);
        return;
    }

    // find all file, which should be converted
    logger.trace(`reading directory from ${input}`);
    const files = await glob(`${input}/**/*.json`);
    logger.debug(`found ${files.length} files for training`);

    const result = await files.reduce(async (promise, fileSource) => {
        const result = await promise;

        // prepare some information for the file
        const fileName = fileSource.split('/').slice(-1).shift().split('.').slice(-2).shift();
        const number   = fileSource.split('/').slice(-2).shift();
        logger.trace({msg: `using`, number, fileName});

        // create sharp
        logger.trace(`loading image ${fileSource}`);
        const input = JSON.parse(fs.readFileSync(fileSource, 'utf-8'));
        result.data.push({input, output: {[number]: 1}});

        return result;
    }, Promise.resolve({data: []}));

    logger.debug(`Writing training data to ${output.training}`);
    fs.writeFileSync(output.training, JSON.stringify(result.data, null, 4));
    logger.debug(`Training data written to ${output.training}`);

    logger.trace(`Training the AI`);
    const net = new brain.NeuralNetwork(ai.config);
    net.train(result.data, {
        ...ai.training,
        log:            false,
        logPeriod:      10,
        callback:       ({iterations, error}) => logger.trace(`AI Training iteration #${iterations} of #${ai.training.iterations} with error ${error}`),
        callbackPeriod: 1
    });
    logger.debug(`AI training finished`);

    logger.debug(`Writing training result to ${output.result}`);
    fs.writeFileSync(output.result, JSON.stringify(net.toJSON(), null, 4));
    logger.debug(`Training result written to ${output.result}`);
}
