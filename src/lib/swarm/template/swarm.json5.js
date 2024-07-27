/**
 *
 * @param prepare
 */
export default ({
                    rawPath, preparePath, colorspace, width, height, channel,
                    trainingDataFile, brainDataFile,
                    hiddenLayers, activation,
                    errorThresh, learningRate, momentum,
                    testOutputFile,
                    testFiles
                }) => {

    let channelValue = `'${channel}'`;
    if (isNaN(Number.parseInt(channel)) === false) {
        channelValue = parseInt(channel);
    }

    //language=JSON5
    return `
    {
        prepare: {
            input: '${rawPath}',
            positions: {
                'pos-1-1': {
                    left: 114,
                    top: 282,
                    width: 36,
                    height: 60,
                },
                'pos-1-2': {
                    left: 149,
                    top: 282,
                    width: 36,
                    height: 55,
                },
                'pos-1-3': {
                    left: 183,
                    top: 282,
                    width: 35,
                    height: 55,
                },
                'pos-1-4': {
                    left: 218,
                    top: 282,
                    width: 33,
                    height: 55,
                },
                'pos-1-5': {
                    left: 251,
                    top: 282,
                    width: 34,
                    height: 55,
                },
                'pos-1-6': {
                    left: 286,
                    top: 282,
                    width: 34,
                    height: 55,
                },
                'pos-2-1': {
                    left: 179,
                    top: 338,
                    width: 35,
                    height: 60,
                },
                'pos-2-2': {
                    left: 215,
                    top: 338,
                    width: 35,
                    height: 60,
                },
            },
            actions: [
                {
                    type: 'clear',
                    directory: '${preparePath}',
                    onlyRunOnce: true,
                },
                {type:  'sharpen', options: 10},
                'crop',
                {type:  'sharpen', options: 10},
                {type:  'linear', a: 1.5, b: 0},
    
                ${colorspace !== null ? `{type:  'colorspace', value: '${colorspace}'},` : ''}
    
                {type:  'resize', width: ${width}, height: ${height}, options: {fit: 'fill', background:  {r: 255, g: 255, b: 255, alpha: 1}}},
                ${channel !== null ? `{type:  'extractChannel', channel: ${channelValue}},` : ''}
                {type:  'png', options: {force: true}},
                {
                    type: 'save',
                    as: 'image',
                    file: '${preparePath}/{number}-{fileName}-{position}.png',
                },
                {
                    type: 'save',
                    as: 'json5',
                    file: '${preparePath}/{number}-{fileName}-{position}.json5',
                },
            ],
        },
        createTrainingData: {
            input: '${preparePath}',
            output:'${trainingDataFile}',
        },
        training: {
            input: '${trainingDataFile}',
            output: '${brainDataFile}',
            ai: {
                config: {
                    hiddenLayers: ${JSON.stringify(hiddenLayers)},
                    activation: '${activation}',
                },
                training: {
                    iterations: 2000,
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