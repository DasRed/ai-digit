import fs from 'fs';
import {glob} from 'glob';
import sharp from 'sharp';
import logger from '../logger.js';
import prepareActions from '../prepare/actions/index.js';

export default async function ({input, actions, output, deleteSource, clear}) {
    logger.trace({msg: 'Starting prepare with', input, output});

    // clear destination directory
    if (clear === true) {
        const files = await glob(`${output.directory}/**/*.{png,jpeg,jpg,json}`);
        logger.trace(`${files.length} files found to delete`);
        await Promise.all(files.map((file) => {
            logger.trace(`Deleting file ${file}`);
            return fs.promises.unlink(file);
        }));
        logger.debug(`Output directory ${output.directory} cleared`);
    }
    else {
        logger.debug(`Output directory ${output.directory} will be not cleared`);
    }

    // find all file, which should be converted
    logger.trace(`reading directory from ${input}`);
    const files = await glob(`${input}/**/*.{png,jpeg,jpg}`);
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
        image = await actions.reduce(async (promise, actionConfig) => {
            let image = await promise;

            if (typeof actionConfig === 'string') {
                actionConfig = {type: actionConfig};
            }

            const actionFn = prepareActions[actionConfig.type] ?? (() => image);

            logger.trace(`running action ${actionConfig.type}`);
            image = await actionFn(image, actionConfig, {position, fileName, number});

            logger.trace(`action ${actionConfig.type} done`);
            const buffer = await image.toBuffer({resolveWithObject: true});
            return sharp(buffer.data);
        }, Promise.resolve(image));

        //await saveAsJson(image, fileOutputJson);
        //await saveAsImage(image, fileOutputImage);

        // delete source file
        if (deleteSource) {
            fs.unlinkSync(fileSource);
            logger.trace(`Source file ${fileSource} deleted`);
        }

        logger.debug(`File ${fileSource} prepared`);
    }, Promise.resolve())
}
//
//async function saveAsImage(image, fileOutput) {
//    const buffer = await image.toBuffer({resolveWithObject: true});
//    const clone  = sharp(buffer.data);
//    await clone.toFile(fileOutput);
//    logger.trace(`Image area saved to ${fileOutput}`);
//}
//
//async function saveAsJson(image, fileOutput) {
//    const buffer = await image.toBuffer({resolveWithObject: true});
//    const clone  = sharp(buffer.data);
//
//    // save new image to file
//    const array = await clone.raw().toArray();
//    const data = Array.from(array[0]);
//    const max = Math.max(...data);
//
//    fs.writeFileSync(fileOutput, JSON.stringify(data.map((value) => value / max),null, 4));
//    logger.trace(`JSON area saved to ${fileOutput}`);
//}