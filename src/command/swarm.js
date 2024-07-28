import wait from '@dasred/wait';
import Docker from 'dockerode';
import fs from 'fs';
import asyncFilter from '../lib/asyncFilter.js';
import createJobStructure from '../lib/swarm/createJobStructure.js';
import logger from '../logger.js';
import build from './build.js';
import createTrainingData from './createTrainingData.js';
import prepare from './prepare.js';

export default async function (config) {
    logger.trace('Starting swarm');

    if (config.delete === true) {
        fs.rmSync(config.paths.jobs, {recursive: true, force: true});
        fs.mkdirSync(config.paths.jobs, {recursive: true});
    }

    const docker = new Docker(config.docker);

    // prepare
    /** @var {Object.<String, Job>} */
    const {prepares, jobs} = createJobStructure(docker, config);

    await Object.values(prepares).reduce(async (promise, prepareConfig) => {
        await promise;

        if (fs.existsSync(prepareConfig.path) === false) {
            fs.mkdirSync(prepareConfig.path, {recursive: true});
            await prepare(prepareConfig.prepare);
        }

        await createTrainingData(prepareConfig.createTrainingData)
    }, Promise.resolve());

    /** @var {Job[]} */
    const jobsToRun = Object.values(jobs).filter((job) => {
        if (config.overwrite === false && job.isTestDone() === true) {
            return false;
        }
        job.createPathsAndFiles();

        return true;
    });
    const maxCount = jobsToRun.length;

    /** @var {Job[]} */
    let jobsCurrentlyRunning = [];

    await build(config);
    do {
        // remove finished jobs
        jobsCurrentlyRunning = await asyncFilter(jobsCurrentlyRunning, /** @param {Job} job */ async (job) => {
            if (await job.isFinished()) {
                await job.remove();
                return false;
            }
            return true;
        });

        // fill up with new jobs
        const jobsStarted    = await Promise.all(
            jobsToRun.splice(0, config.maxParallel - jobsCurrentlyRunning.length)
                     .map((job) => job.start())
        )
        jobsCurrentlyRunning = jobsCurrentlyRunning.concat(jobsStarted);

        logger.debug(`#${jobsCurrentlyRunning.length} Jobs running. #${jobsToRun.length} of ${maxCount} Jobs are left. Waiting...`);
        await wait(1000);
    } while (jobsToRun.length > 0);

    logger.info(`Swarm finished`);
}
