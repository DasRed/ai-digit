import crypto from 'crypto';
import fs from 'fs';
import {glob} from 'glob';
import logger from '../logger.js';

export default async function ({input, output, overwrite}) {
    logger.trace('Starting test2csv');

    if (overwrite === false && fs.existsSync(output) === true) {
        logger.warn(`Output file ${output} exitis. Abort...`);
        return;
    }

    // old test result path style
    const testResults = (await glob(input))
        .filter((file) => {
            const stat = fs.statSync(file);
            return stat.size !== 0;
        })
        .map((file) => {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

            data.file = file;
            data.id = data.id ?? crypto.createHash('md5').update(JSON.stringify([
                data.info.dimension[0],
                data.info.dimension[1],
                data.info.channel,
                data.info.colorspace,
                data.info.ai.config.hiddenLayers.join(', '),
                data.info.ai.config.activation,
                data.info.ai.training.momentum,
                data.info.ai.training.errorThresh,
                data.info.ai.training.learningRate,
            ])).digest('hex');
            return data;
        });

    const csv = ['Id;Width;Height;Channel;Colorspace;HiddenLayers;Activation;Iterations;Momentum;ErrorThresh;LearningRate;0 Weight;0 Success;1 Weight;1 Success;2 Weight;2 Success;3 Weight;3 Success;4 Weight;4 Success;5 Weight;5 Success;6 Weight;6 Success;7 Weight;7 Success;8 Weight;8 Success;9 Weight;9 Success;File'].concat(
        testResults.map(
            (result) => [
                result.id,
                result.info.dimension[0].toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
                result.info.dimension[1].toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
                String(result.info.channel),
                String(result.info.colorspace),
                result.info.ai.config.hiddenLayers.join(', '),
                result.info.ai.config.activation,
                result.info.ai.training.iterations,
                result.info.ai.training.momentum.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
                result.info.ai.training.errorThresh.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
                result.info.ai.training.learningRate.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10})
            ].join(';') + ';' + result.csv.replaceAll('✅', 'Y').replaceAll('❌', 'N') + ';' + result.file
        )
    );

    fs.writeFileSync(output, csv.join('\n'));

    logger.info(`Test2csv finished`);
}
