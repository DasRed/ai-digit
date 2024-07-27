import {glob} from 'glob';
import path from 'path';
import sharp from 'sharp';
import clone from '../lib/sharp/clone.js';
import logger from '../logger.js';
import prepareActions from '../prepare/actions/index.js';

export default async function ({input, positions, actions}) {
    logger.debug({msg: 'Starting prepare with', input});

    await Array.from('0123456789').reduce(
        (promise, number) => Object.entries(positions).reduce(
            async (promise, [position, rect]) => {
                await promise;

                const directory = input.replace('{number}', number).replace('{position}', position);

                // find all file, which should be converted
                logger.trace(`reading directory from ${directory}`);
                const files = await glob(`${directory}/**/*.{png,jpeg,jpg,gif}`);
                logger.debug(`found ${files.length} files in ${directory}`);

                return files.reduce(async (promise, fileSource) => {
                    await promise;

                    // prepare some information for the file
                    const fileName = path.basename(fileSource).split('.').slice(-2).shift();
                    logger.trace({msg: `using`, number, position, fileName});

                    // create sharp
                    logger.trace(`loading image ${fileSource}`);
                    let image = sharp(fileSource);

                    logger.trace(`running ${Object.values(actions).length} actions`);
                    await actions.reduce(async (promise, actionConfig) => {
                        let image = await promise;

                        if (typeof actionConfig === 'string') {
                            actionConfig = {type: actionConfig};
                        }

                        const actionFn = prepareActions[actionConfig.type] ?? (() => image);

                        logger.trace(`running action ${actionConfig.type}`);
                        const meta = await image.metadata();
                        image      = await actionFn(image, actionConfig, {position, fileName, number, fileSource, meta, rect});
                        image      = await clone(image);

                        logger.trace(`action ${actionConfig.type} done`);
                        return image;
                    }, Promise.resolve(image));

                    logger.debug(`File ${fileSource} prepared`);
                }, Promise.resolve());
            }, promise),
        Promise.resolve()
    );

    logger.info('Prepare finished.');
}