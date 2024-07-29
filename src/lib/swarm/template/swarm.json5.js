/**
 *
 * @param prepare
 */
export default ({
                    info,
                    trainingDataFile, brainDataFile,
                    hiddenLayers, activation,
                    iteration, errorThresh, learningRate, momentum,
                    testOutputFile,
                    testFiles
                }) => {

    //language=JSON5
    return `
    {
        info: ${JSON.stringify(info, null, 4)},
        training: {
            input: '${trainingDataFile}',
            output: '${brainDataFile}',
            ai: {
                config: {
                    hiddenLayers: ${JSON.stringify(hiddenLayers)},
                    activation: '${activation}',
                },
                training: {
                    iterations: ${iteration},
                    errorThresh: ${errorThresh},
                    learningRate: ${learningRate},
                    momentum: ${momentum},
                },
            },
        },
        test: {
            data: '${brainDataFile}',
            output: '${testOutputFile}',
            inputs: ${JSON.stringify(testFiles, null, 20)}
        },
    }`;
}