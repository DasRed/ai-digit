import brain from 'brain.js';
import fs from 'fs';
import JSON5 from 'json5';
import logger from '../logger.js';

export default async function ({input = undefined, inputs = [], output, data: trainingData}) {
    logger.trace({msg: 'Starting run with', input, output, trainingData});

    if (input !== undefined) {
        inputs.push(input);
    }

    const net       = new brain.NeuralNetwork();
    const brainData = JSON.parse(fs.readFileSync(trainingData, 'utf-8'));
    net.fromJSON(brainData.data);

    const result = await inputs.reduce(async (promise, input) => {
        const result = await promise;

        logger.trace(`Test file ${input}`);
        const data    = JSON5.parse(fs.readFileSync(input, 'utf-8'))
        const outcome = Object.entries(net.run(data.array))
                              .map(([number, weight]) => ({number, weight}))
                              .sort((a, b) => {
                                  if (a.weight < b.weight) {
                                      return 1;
                                  }
                                  else if (a.weight > b.weight) {
                                      return -1;
                                  }
                                  return 0;
                              });

        result.push({
            success: data.number === Number(outcome[0].number),
            should:  data.number,
            is:      Number(outcome[0].number),
            weight:  outcome.find((e) => Number(e.number) === data.number).weight,
            file:    input,
            result:  outcome
        });

        return result;
    }, Promise.resolve([]));

    logger.debug(`Writing result to ${output}`);
    fs.writeFileSync(output, JSON.stringify({
        info:   brainData.info,
        csv:    result.map((o) => `${o.weight.toLocaleString('de', {maximumFractionDigits: 20, minimumFractionDigits: 0})};${o.success ? 'Y' : 'N'}`).join(';'),
        output: result
    }, null, 4));
    logger.info(`Result written to ${output}`);
}