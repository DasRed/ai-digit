import brain from 'brain.js';
import fs from 'fs';
import logger from '../logger.js';

export default async function ({input, output, overwrite, ai}, fullConfig) {
    logger.trace(`Training the AI`);

    // if the destination file exits and overwrite is disabled
    if (overwrite === false && fs.existsSync(output) === true) {
        logger.warn(`can not handle file ${output}, because destination file ${output} exists!`);
        return;
    }

    logger.trace(`loading training data ${input}`);
    const data = JSON.parse(fs.readFileSync(input, 'utf-8'));

    const net = new brain.NeuralNetwork(ai.config);
    net.train(data, {
        ...ai.training,
        log:            false,
        logPeriod:      1,
        callback:       ({iterations, error}) => logger.trace(`AI Training iteration #${iterations} of #${ai.training.iterations} with error ${error}`),
        callbackPeriod: 1
    });
    logger.debug(`AI training finished`);

    logger.debug(`Writing training result to ${output}`);
    fs.writeFileSync(output, JSON.stringify({
        info: {
            ai,
            ...fullConfig.info ?? {}
        },
        data: net.toJSON(),
    }, null, 4));
    logger.debug(`Training result written to ${output}`);
}
