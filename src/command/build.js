import Docker from 'dockerode';
import {glob} from 'glob';
import logger from '../logger.js';

export default async function (config) {
    logger.trace('Starting docker build');

    const docker = new Docker(config.docker);

    const images = await docker.listImages({filters: JSON.stringify({label: ['ai-digit']})});
    await Promise.all(images.map(async ({Id: id}) => {
        logger.trace(`deleting old docker AIDigit image ${id}`);
        const image = await docker.getImage(id);
        await image.remove({force: true});
        logger.trace(`old docker AIDigit image ${id} deleted`);
    }));

    //
    //await new Promise((resolve, reject) => {
    //    const child = spawn('docker', ['-H', `tcp://${config.docker.host}:${config.docker.port}`, 'build', '-t', `${config.image}:latest`, process.cwd()]);
    //    child.stdout.on('data', (data) => logger.trace(String(data)));
    //    child.stderr.on('data', (data) => logger.error(String(data)));
    //    child.on('error', (error) => logger.error(error.message));
    //    child.on('close', (code) => {
    //        if (code === 0) {
    //            resolve();
    //        }
    //        else {
    //            reject(`child process exited with code ${code}`);
    //        }
    //    });
    //});


    logger.trace(`Building new docker image`);
    const stream = await docker.buildImage({
        context: process.cwd(),
        src:     await glob('**'),
    }, {
        t:      config.image,
        labels: JSON.stringify({'ai-digit': ''}),
    });

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(
            stream,
            (err, res) => err ? reject(err) : resolve(res),
            (obj) => obj.stream || obj.status ? logger.trace((obj.stream ?? obj.status).replace(`\n`, '')) : ''
        );
    });

    logger.info(`Docker build finished`);
}


//
//
//async function main() {
//    let ignorePatterns = await fs.readFile('.dockerignore');
//
//    const ignores = [];
//    for (const pattern of ignorePatterns.toString().split('\n')) {
//        let line = pattern.trim();
//        if (line.startsWith('/')) {
//            line = line.slice(1)
//        }
//        if (line.startsWith('#')) {
//            continue
//        }
//        if (line.length == 0) {
//            continue
//        }
//        ignores.push(line);
//    }
//
//    let entries = await glob('**', {ignore: ignores});
//
//    var pack = tar.pack(process.cwd(), {entries})