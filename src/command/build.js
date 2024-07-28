import Docker from 'dockerode';
import fs from 'fs';
import {glob} from 'glob';
import logger from '../logger.js';

export default async function (config) {
    logger.trace('Starting docker build');

    const src = await glob('**', {
        ignore: fs.readFileSync('.dockerignore', 'utf-8').split('\n').reduce((ignore, pattern) => {
            let line = pattern.trim();
            if (line.length === 0 || line.startsWith('#')) {
                return ignore;
            }

            if (line.startsWith('/')) {
                line = line.slice(1)
            }
            ignore.push(`${line}/**`);
            ignore.push(line);

            return ignore;
        }, [])
    });

    const docker = new Docker(config.docker);

    const images = await docker.listImages({filters: JSON.stringify({label: [config.image]})});
    await Promise.all(images.map(async ({Id: id}) => {
        logger.trace(`deleting old docker AIDigit image ${id}`);
        const image = await docker.getImage(id);
        await image.remove({force: true});
        logger.trace(`old docker AIDigit image ${id} deleted`);
    }));

    logger.trace(`Building new docker image`);
    const stream = await docker.buildImage({
        context: process.cwd(),
        src,
    }, {
        t:      config.image,
        labels: JSON.stringify({[config.image]: ''}),
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