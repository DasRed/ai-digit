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
            data.id   = data.id ?? crypto.createHash('md5').update(JSON.stringify([
                data.info.dimension[0],
                data.info.dimension[1],
                data.info.channel,
                data.info.colorspace,
                data.info.ai.config.hiddenLayers.join(', '),
                data.info.ai.config.activation,
                data.info.ai.training.iterations,
                data.info.ai.training.momentum,
                data.info.ai.training.errorThresh,
                data.info.ai.training.learningRate,
            ])).digest('hex');
            return data;
        });

    const csv = [
        [
            'Id', 'Timestamp',
            'Width', 'Height', 'Channel', 'Colorspace',
            'HiddenLayers', 'Activation',
            'Iterations', 'Momentum', 'ErrorThresh', 'LearningRate',
            '0 Weight', '0 Match',
            '1 Weight', '1 Match',
            '2 Weight', '2 Match',
            '3 Weight', '3 Match',
            '4 Weight', '4 Match',
            '5 Weight', '5 Match',
            '6 Weight', '6 Match',
            '7 Weight', '7 Match',
            '8 Weight', '8 Match',
            '9 Weight', '9 Match',
            'File'
        ].join(';')
    ].concat(testResults.map((result) => {
        const line = [
            result.id,
            result.timestamp ?? (new Date(fs.statSync(result.file).mtimeMs)).toJSON(),

            result.info.dimension[0].toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
            result.info.dimension[1].toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
            String(result.info.channel),
            String(result.info.colorspace),

            result.info.ai.config.hiddenLayers.join(', '),
            result.info.ai.config.activation,
            result.info.ai.training.iterations.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
            result.info.ai.training.momentum.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
            result.info.ai.training.errorThresh.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
            result.info.ai.training.learningRate.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10})
        ];

        result.output.forEach((entry) => line.push(
            entry.weight.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
            entry.is,
        ));

        line.push(result.file);

        return line.join(';');
    }));

    fs.writeFileSync(output, csv.join('\n'));

    logger.info(`Test2csv finished`);
}
