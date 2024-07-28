import fs from 'fs';
import logger from '../../logger.js';
import template from './template/swarm.json5.js';

/**
 * @typedef {Object} JobConfig
 * @property {string} id
 * @property {string} name
 * @property {string} basePath
 * @property {string} configFile
 * @property {string} trainingDataFile
 * @property {string} brainDataFile
 * @property {string} testOutputFile
 * @property {string} logFile
 * @property {string[]} Binds
 * @property {Object} runtime
 * @property {string} runtime.configFile
 * @property {string} runtime.rawPath
 * @property {string} runtime.preparePath
 * @property {string} runtime.colorspace
 * @property {string} runtime.width
 * @property {string} runtime.height
 * @property {string} runtime.channel
 * @property {string} runtime.trainingDataFile
 * @property {string} runtime.brainDataFile
 * @property {string} runtime.hiddenLayers
 * @property {string} runtime.activation
 * @property {string} runtime.errorThresh
 * @property {string} runtime.learningRate
 * @property {string} runtime.momentum
 * @property {string} runtime.testOutputFile
 * @property {string} runtime.testFiles
 */

export default class Job {
    /**
     * @param {import('dockerode')} docker
     * @param {number} verbose
     * @param {string} dockerImage
     * @param {JobConfig} config
     */
    constructor(docker, dockerImage, verbose, config) {
        this.docker      = docker;
        this.dockerImage = dockerImage;
        this.verbose     = verbose;
        this.config      = config;
    }

    createPathsAndFiles() {
        fs.mkdirSync(this.config.basePath, {recursive: true});
        fs.writeFileSync(this.config.configFile, '');
        fs.writeFileSync(this.config.brainDataFile, '');
        fs.writeFileSync(this.config.testOutputFile, '');
        fs.writeFileSync(this.config.logFile, '');
        fs.writeFileSync(this.config.configFile, template(this.config.runtime));

        logger.trace(`Paths, files and config created for ${this.config.configFile}`);
        return this;
    }

    /**
     * @returns {Promise<number>}
     */
    async getExitCode() {
        if (this.container === undefined) {
            return undefined;
        }

        const inspect = await this.container.inspect();
        return inspect?.State?.ExitCode ?? 0;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isFinished() {
        if (this.container === undefined) {
            return false;
        }

        const inspect = await this.container.inspect();
        return (inspect?.State?.Status ?? '?') === 'exited';
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isRunning() {
        if (this.container === undefined) {
            return false;
        }

        try {
            const inspect = await this.container.inspect();
            return inspect?.State?.Running ?? false;
        }
        catch {
            return false;
        }
    }

    /**
     * @returns {Promise<Job>}
     */
    async remove() {
        fs.writeFileSync(this.config.logFile, String(await this.container.logs({stdout: true})));

        try {
            await this.container.stop();
        }
        catch {
        }

        try {
            await this.container.remove();
        }
        catch {
        }

        logger.debug(`[${this.config.name}] container removed with name ${this.config.name}`);
        return this;
    }

    /**
     * @returns {Promise<this>}
     */
    async start() {
        /** @var {Container} */
        this.container = await this.docker.createContainer({
            Image:      this.dockerImage,
            Labels:     {'ai-digit-id': this.config.id},
            HostConfig: {Binds: this.config.Binds},
            Cmd:        (this.verbose === 0 ? [] : ['-' + 'v'.repeat(this.verbose)])
                            .concat(['-c', this.config.runtime.configFile, 'training', 'test'])
        });
        logger.trace(`[${this.config.name}] container created with name ${this.config.name}`);

        await this.container.rename({name: this.config.name});
        await this.container.start();
        logger.debug(`[${this.config.name}] container started with name ${this.config.name}`);

        return this;
    }
}
