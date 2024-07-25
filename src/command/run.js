import brain from 'brain.js';
import fs from 'fs';
import logger from '../logger.js';

export default async function ({input = undefined, inputs = [], output, data: trainingData}) {
    logger.trace({msg: 'Starting run with', input, output, trainingData});

    if (input !== undefined) {
        inputs.push(input);
    }

    await inputs.reduce((promise, input) => {
        // create sharp
        //logger.trace(`loading image ${input}`);
        //const image = sharp(input);

        logger.info(input);
        const net = new brain.NeuralNetwork();
        net.fromJSON(JSON.parse(fs.readFileSync(trainingData, 'utf-8')));

        const data   = JSON.parse(fs.readFileSync(input, 'utf-8'))
        const result = net.run(data);
        Object.entries(result)
              .map(([number, weight]) => ({number, weight}))
              .sort((a, b) => {
                  if (a.weight < b.weight) {
                      return 1;
                  }
                  else if (a.weight > b.weight) {
                      return -1;
                  }
                  return 0;
              })
              .forEach(({number, weight}) => logger.info(`    #${number} => ${(weight * 100).toLocaleString('de', {maximumFractionDigits: 15, minimumFractionDigits: 15})} %`));
    }, Promise.resolve())
}