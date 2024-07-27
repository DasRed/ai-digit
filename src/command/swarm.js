import wait from '@dasred/wait';
import Docker from 'dockerode';
import asyncFilter from '../lib/asyncFilter.js';
import createJobStructure from '../lib/swarm/createJobStructure.js';
import logger from '../logger.js';
import build from './build.js';

export default async function (config) {
    logger.trace('Starting swarm');

    await build(config);

    const docker = new Docker(config.docker);

    // prepare
    /** @var {Object.<String, Job>} */
    const jobs = createJobStructure(docker, config);

    /** @var {Job[]} */
    const jobsToRun = Object.values(jobs).map((job) => job.createPathsAndFiles());

    /** @var {Job[]} */
    let jobsCurrentlyRunning = [];

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

        logger.debug(`#${jobsCurrentlyRunning.length} Jobs running. #${jobsToRun.length} Jobs waiting for running. Waiting...`);
        await wait(1000);
    } while (jobsToRun.length > 0);

    logger.info(`Swarm finished`);
}
