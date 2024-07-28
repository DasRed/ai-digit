import {customAlphabet} from 'nanoid'
import logger from '../../logger.js';
import Job from './Job.js';

const nanoid = customAlphabet('1234567890abcdef', 20);

/**
 *
 * @param {import('dockerode')} docker
 * @param verbose
 * @param {string} dockerImage
 * @param {string} nameTemplate
 * @param paths
 * @param {Object} mounts
 * @param mounts.raw
 * @param mounts.jobs
 * @param mounts.src
 * @param {Object} config
 * @param config.dimensions
 * @param config.channels
 * @param config.colorspaces
 * @param config.hiddenLayers
 * @param config.activations
 * @param config.momentums
 * @param config.errorThreshs
 * @param config.learningRates
 * @param config.testFiles
 */
export default function createJobStructure(docker, {verbose, image: dockerImage, name: nameTemplate, paths, mounts, config}) {
    const jobs     = {};
    const prepares = {};

    logger.trace(`Starting to create the job definition`);

    // config structure
    for (const dimension of config.dimensions) {
        for (const channel of config.channels) {
            let channelValue = channel;
            if (isNaN(Number.parseInt(channel)) === false) {
                channelValue = Number.parseInt(channel);
            }

            for (const colorspace of config.colorspaces) {
                const prepareId     = nanoid();
                const prepareSubPath = `dimension-${dimension[0]}x${dimension[1]}-channel-${JSON.stringify(channel).replaceAll('"', '')}-colorspace-${JSON.stringify(colorspace).replaceAll('"', '')}`;
                const pathPrepared  = `${paths.prepared}/${prepareSubPath}`;
                prepares[prepareId] = {
                    id:     prepareId,
                    path:   pathPrepared,
                    prepare: {
                        input:     paths.rawTemplate,
                        positions: {
                            'pos-1-1': {
                                left:   114,
                                top:    282,
                                width:  36,
                                height: 60,
                            },
                            'pos-1-2': {
                                left:   149,
                                top:    282,
                                width:  36,
                                height: 55,
                            },
                            'pos-1-3': {
                                left:   183,
                                top:    282,
                                width:  35,
                                height: 55,
                            },
                            'pos-1-4': {
                                left:   218,
                                top:    282,
                                width:  33,
                                height: 55,
                            },
                            'pos-1-5': {
                                left:   251,
                                top:    282,
                                width:  34,
                                height: 55,
                            },
                            'pos-1-6': {
                                left:   286,
                                top:    282,
                                width:  34,
                                height: 55,
                            },
                            'pos-2-1': {
                                left:   179,
                                top:    338,
                                width:  35,
                                height: 60,
                            },
                            'pos-2-2': {
                                left:   215,
                                top:    338,
                                width:  35,
                                height: 60,
                            },
                        },
                        actions:   [].concat(
                            {
                                type:        'clear',
                                directory:   pathPrepared,
                                onlyRunOnce: true,
                            },
                            {type: 'sharpen', options: 10},
                            'crop',
                            {type: 'sharpen', options: 10},
                            {type: 'linear', a: 1.5, b: 0},
                            colorspace !== null ? [{type: 'colorspace', value: colorspace}] : [],
                            {type: 'resize', width: dimension[0], height: dimension[1], options: {fit: 'fill', background: {r: 255, g: 255, b: 255, alpha: 1}}},
                            channel !== null ? [{type: 'extractChannel', channel: channelValue}] : [],
                            {type: 'png', options: {force: true}},
                            {
                                type: 'save',
                                as:   'image',
                                file: `${pathPrepared}/{number}-{fileName}-{position}.png`,
                            },
                            {
                                type: 'save',
                                as:   'json5',
                                file: `${pathPrepared}/{number}-{fileName}-{position}.json5`,
                            },
                        ),
                    },
                    createTrainingData: {
                        input: pathPrepared,
                        output: `${pathPrepared}/training.json`,
                        overwrite: false,
                    },
                };

                for (const hiddenLayers of config.hiddenLayers) {
                    for (const activation of config.activations) {
                        for (const momentum of config.momentums) {
                            for (const errorThresh of config.errorThreshs) {
                                for (const learningRate of config.learningRates) {
                                    const id      = nanoid();
                                    const subPath = `${id.substring(0, 1)}/${id.substring(1, 2)}/${id}`;
                                    jobs[id]      = new Job(docker, dockerImage, verbose, {
                                        id,
                                        name:             nameTemplate.replace('{id}', id),
                                        basePath:         `${paths.jobs}/${subPath}`,
                                        configFile:       `${paths.jobs}/${subPath}/config.json5`,
                                        trainingDataFile: `${paths.jobs}/${subPath}/training.json`,
                                        brainDataFile:    `${paths.jobs}/${subPath}/brain.json`,
                                        testOutputFile:   `${paths.jobs}/${subPath}/test.json`,
                                        logFile:          `${paths.jobs}/${subPath}/log.log`,
                                        Binds:            [
                                            `${mounts.raw}:${mounts.src}/raw`,
                                            `${mounts.prepared}/${prepareSubPath}:${mounts.src}/prepared`,
                                            `${mounts.jobs}/${subPath}:${mounts.src}/${id}`,
                                        ],
                                        runtime:          {
                                            info: {
                                                dimension,
                                                channel,
                                                colorspace,
                                            },
                                            configFile:       `${mounts.src}/${id}/config.json5`,
                                            trainingDataFile: `${mounts.src}/prepared/training.json`,
                                            brainDataFile:    `${mounts.src}/${id}/brain.json`,
                                            hiddenLayers,
                                            activation,
                                            errorThresh,
                                            learningRate,
                                            momentum,
                                            testOutputFile:   `${mounts.src}/${id}/test.json`,
                                            testFiles:        config.testFiles.map((testFile) => `${mounts.src}/prepared/${testFile}`)
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    logger.trace(`Defined #${Object.values(jobs).length} jobs`);
    return {prepares, jobs};
}