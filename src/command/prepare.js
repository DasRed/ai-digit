import fs from 'fs';
import {glob} from 'glob';
import sharp from 'sharp';
import clone from '../lib/sharp/clone.js';
import logger from '../logger.js';
import prepareActions from '../prepare/actions/index.js';

export default async function ({input, positions, actions}) {
    logger.trace({msg: 'Starting prepare with', input});


    //Array.from('0123456789').forEach((number) => )



    // find all file, which should be converted
    logger.trace(`reading directory from ${input}`);
    const files = await glob(`${input}/**/*.{png,jpeg,jpg,gif}`);
    logger.debug(`found ${files.length} files`);

    await files.reduce(async (promise, fileSource) => {
        await promise;

        // prepare some information for the file
        const position        = fileSource.split('/').slice(-2).shift();
        const fileName        = fileSource.split('/').slice(-1).shift().split('.').slice(-2).shift();
        const number          = fileSource.split('/').slice(-3).shift();
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
            image = await actionFn(image, actionConfig, {position, fileName, number, fileSource, meta});
            image = await clone(image);

            logger.trace(`action ${actionConfig.type} done`);
            return image;
        }, Promise.resolve(image));

        logger.debug(`File ${fileSource} prepared`);
    }, Promise.resolve())
}