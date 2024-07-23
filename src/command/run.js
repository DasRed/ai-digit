import brain from 'brain.js';
import fs from 'fs';
import sharp from 'sharp';
import logger from '../logger.js';

export default async function ({input, output, data: trainingFile}) {
    logger.trace({msg: 'Starting run with', input, output, trainingFile});

    // create sharp
    logger.trace(`loading image ${input}`);
    const image = sharp(input);

    const net = new brain.NeuralNetwork();
    net.train(JSON.parse(fs.readFileSync(trainingFile, 'utf-8')), {iterations: 10, log: true, logPeriod: 1});

    const data = await image.raw().toArray();
    logger.info(net.run(Array.from(data)));
}