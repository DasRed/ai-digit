import crypto from 'crypto';
import {customAlphabet} from 'nanoid'
import logger from '../../logger.js';
import Job from './Job.js';

const nanoid = customAlphabet('1234567890abcdef', 20);

function replaceVars(obj, values) {
    if (typeof obj !== 'object') {
        return obj;
    }
    Object.keys(obj).forEach((key) => {
        if (typeof obj[key] !== 'string') {
            return;
        }
        Object.entries(values).forEach(([name, value]) => obj[key] = obj[key].replaceAll(`{${name}}`, value));
    });

    return obj;
}

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
 * @param jobPathName
 * @param config.dimensions
 * @param config.channels
 * @param config.colorspaces
 * @param config.blackWhites
 * @param config.hiddenLayers
 * @param config.activations
 * @param config.momentums
 * @param config.iterations
 * @param config.errorThreshs
 * @param config.learningRates
 * @param config.testFiles
 * @param {{}[]} config.actions
 */
export default function createJobStructure(docker, {verbose, image: dockerImage, name: nameTemplate, paths, mounts, config, jobPathName}) {
    const jobs     = [];
    const prepares = [];

    logger.trace(`Starting to create the job definition`);

    paths.jobs  = paths.jobs.replace('{jobPathName}', jobPathName);
    mounts.jobs = mounts.jobs.replace('{jobPathName}', jobPathName);

    // config structure
    for (const dimension of config.dimensions) {
        for (const channel of config.channels) {
            for (const blackWhite of config.blackWhites ?? [false]) {
                let channelValue = channel;
                if (isNaN(Number.parseInt(channel)) === false) {
                    channelValue = Number.parseInt(channel);
                }

                for (const colorspace of config.colorspaces) {
                    const prepareId      = nanoid();
                    const prepareSubPath = [
                        `dimension`, `${dimension[0]}x${dimension[1]}`,
                        `channel`, JSON.stringify(channel).replaceAll('"', ''),
                        `colorspace`, JSON.stringify(colorspace).replaceAll('"', ''),
                        `blackwhite`, blackWhite ? '1' : '0'
                    ].join('-');
                    const pathPrepared   = `${paths.prepared}/${prepareSubPath}`;
                    const values         = {width: dimension[0], height: dimension[1], channel, channelValue, colorspace, pathPrepared, blackWhite};
                    prepares.push({
                        id:                 prepareId,
                        path:               pathPrepared,
                        prepare:            {
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
                            actions:   config.actions
                                             .filter((action) => action.test === undefined || values[action.test] !== null)
                                             .map((action) => replaceVars(action, values)),
                        },
                        createTrainingData: {
                            input:     pathPrepared,
                            output:    `${pathPrepared}/training.json`,
                            overwrite: false,
                        },
                    });

                    for (const hiddenLayers of config.hiddenLayers) {
                        for (const activation of config.activations) {
                            for (const iteration of config.iterations ?? [2000]) {
                                for (const momentum of config.momentums) {
                                    for (const errorThresh of config.errorThreshs) {
                                        for (const learningRate of config.learningRates) {
                                            const id      = nanoid();
                                            const subPath = [
                                                prepareSubPath,
                                                `hiddenLayers`, JSON.stringify(hiddenLayers),
                                                `activation`, activation,
                                                `iteration`, iteration,
                                                `momentum`, momentum,
                                                `errorThresh`, errorThresh,
                                                `learningRate`, learningRate
                                            ].join('-');
                                            jobs.push(new Job(docker, dockerImage, verbose, {
                                                id,
                                                name:             nameTemplate.replace('{id}', id),
                                                basePath:         `${paths.jobs}/${subPath}`,
                                                configFile:       `${paths.jobs}/${subPath}/config.json5`,
                                                trainingDataFile: `${paths.jobs}/${subPath}/training.json`,
                                                brainDataFile:    `${paths.jobs}/${subPath}/brain.json`,
                                                testOutputFile:   `${paths.jobs}/${subPath}/test.json`,
                                                logFile:          `${paths.jobs}/${subPath}/log.log`,
                                                binds:            [
                                                    `${mounts.raw}:${mounts.src}/raw`,
                                                    `${mounts.prepared}/${prepareSubPath}:${mounts.src}/prepared`,
                                                    `${mounts.jobs}/${subPath}:${mounts.src}/${subPath}`,
                                                ],
                                                labels:           {
                                                    'ai-digit-id':           String(id),
                                                    'ai-digit-dimension':    JSON.stringify(dimension),
                                                    'ai-digit-channel':      String(channel),
                                                    'ai-digit-colorspace':   String(colorspace),
                                                    'ai-digit-blackWhite':   blackWhite ? 'true' : 'false',
                                                    'ai-digit-hiddenLayers': JSON.stringify(hiddenLayers),
                                                    'ai-digit-activation':   String(activation),
                                                    'ai-digit-iterations':   String(iteration),
                                                    'ai-digit-momentum':     String(momentum),
                                                    'ai-digit-errorThresh':  String(errorThresh),
                                                    'ai-digit-learningRate': String(learningRate),
                                                },
                                                runtime:          {
                                                    info:             {
                                                        id: crypto.createHash('md5').update(JSON.stringify([
                                                            dimension[0],
                                                            dimension[1],
                                                            channel,
                                                            colorspace,
                                                            blackWhite,
                                                            hiddenLayers.join(', '),
                                                            activation,
                                                            iteration,
                                                            momentum,
                                                            errorThresh,
                                                            learningRate,
                                                        ])).digest('hex'),
                                                        dimension,
                                                        channel,
                                                        colorspace,
                                                        blackWhite,
                                                    },
                                                    configFile:       `${mounts.src}/${subPath}/config.json5`,
                                                    trainingDataFile: `${mounts.src}/prepared/training.json`,
                                                    brainDataFile:    `${mounts.src}/${subPath}/brain.json`,
                                                    hiddenLayers,
                                                    activation,
                                                    iteration,
                                                    errorThresh,
                                                    learningRate,
                                                    momentum,
                                                    testOutputFile:   `${mounts.src}/${subPath}/test.json`,
                                                    testFiles:        config.testFiles.map((testFile) => `${mounts.src}/prepared/${testFile}`)
                                                }
                                            }));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    logger.trace(`Defined #${jobs.length} jobs`);
    return {prepares, jobs};
}