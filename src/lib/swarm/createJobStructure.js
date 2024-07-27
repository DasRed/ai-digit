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
 * @return {Object.<String, Job>}
 */
export default function createJobStructure(docker, {verbose, image: dockerImage, name: nameTemplate, paths, mounts, config}) {
    const jobs = {};

    logger.trace(`Starting to create the job definition`);

    // config structure
    for (const dimension of config.dimensions) {
        for (const channel of config.channels) {
            for (const colorspace of config.colorspaces) {
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
                                        rawPath:          paths.raw,
                                        basePath:         `${paths.jobs}/${subPath}`,
                                        preparePath:      `${paths.jobs}/${subPath}/prepared`,
                                        configFile:       `${paths.jobs}/${subPath}/config.json5`,
                                        trainingDataFile: `${paths.jobs}/${subPath}/training.json`,
                                        brainDataFile:    `${paths.jobs}/${subPath}/brain.json`,
                                        testOutputFile:   `${paths.jobs}/${subPath}/test.json`,
                                        logFile:          `${paths.jobs}/${subPath}/log.log`,
                                        Binds:            [
                                            `${mounts.raw}:${mounts.src}/raw`,
                                            `${mounts.jobs}/${subPath}:${mounts.src}/${id}`,
                                        ],
                                        runtime:          {
                                            configFile:       `${mounts.src}/${id}/config.json5`,
                                            rawPath:          `${mounts.src}/raw`,
                                            preparePath:      `${mounts.src}/${id}/prepared`,
                                            colorspace,
                                            width:            dimension[0],
                                            height:           dimension[1],
                                            channel,
                                            trainingDataFile: `${mounts.src}/${id}/training.json`,
                                            brainDataFile:    `${mounts.src}/${id}/brain.json`,
                                            hiddenLayers,
                                            activation,
                                            errorThresh,
                                            learningRate,
                                            momentum,
                                            testOutputFile:   `${mounts.src}/${id}/test.json`,
                                            testFiles:        config.testFiles.map((testFile) => `${mounts.src}/${id}/prepared/${testFile}`)
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
    return jobs;
}