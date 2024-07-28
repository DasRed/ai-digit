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
    const maxCount         = jobs.length;

    await prepares.reduce(async (promise, prepareConfig) => {
        await promise;

        if (fs.existsSync(prepareConfig.path) === false) {
            fs.mkdirSync(prepareConfig.path, {recursive: true});
            await prepare(prepareConfig.prepare);
        }

        await createTrainingData(prepareConfig.createTrainingData)
    }, Promise.resolve());

    /** @var {Job[]} */
    const jobsToRun = jobs.filter((job) => {
        if (config.overwrite === false && job.isTestDone() === true) {
            logger.trace(`Job already done. Skipping job ${job.config.configFile}`);
            return false;
        }
        job.createPathsAndFiles();

        return true;
    });

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
    } while (jobsCurrentlyRunning.length > 0);

    const testResults = jobs.filter((job) => job.isTestDone()).map((job) => job.getTestResult());

    //// old test result path style
    //const testResults = (await glob(`${config.paths.jobs}/**/test.json`))
    //    .filter((file) => {
    //        const stat = fs.statSync(file);
    //        return stat.size !== 0;
    //    })
    //    .map((file) => JSON.parse(fs.readFileSync(file, 'utf-8')));

    const csv = ['Width;Height;Channel;Colorspace;HiddenLayers;Activation;Iterations;Momentum;ErrorThresh;LearningRate;0 Weight;0 Success;1 Weight;1 Success;2 Weight;2 Success;3 Weight;3 Success;4 Weight;4 Success;5 Weight;5 Success;6 Weight;6 Success;7 Weight;7 Success;8 Weight;8 Success;9 Weight;9 Success'].concat(
        testResults.map(
            (result) => [
                result.info.dimension[0].toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
                result.info.dimension[1].toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
                String(result.info.channel),
                String(result.info.colorspace),
                result.info.ai.config.hiddenLayers.join(', '),
                result.info.ai.config.activation,
                result.info.ai.training.iterations,
                result.info.ai.training.momentum.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
                result.info.ai.training.errorThresh.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
                result.info.ai.training.learningRate.toLocaleString('de', {minimumFractionDigits: 0, maximumFractionDigits: 10}),
            ].join(';') + ';' + result.csv.replaceAll('✅', 'Y').replaceAll('❌', 'N')
        )
    );

    fs.writeFileSync(config.output.replace('{jobPathName}', config.jobPathName), csv.join('\n'));

    logger.info(`Swarm finished`);
}
