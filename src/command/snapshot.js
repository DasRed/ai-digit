import wait from '@dasred/wait';
import fs from 'fs';
import MjpegDecoder from 'mjpeg-decoder';
import logger from '../logger.js';
import {clear} from '../prepare/actions/clear.js';

export default async function ({stream, count: max, interval, output, warmupInterval, clear: clearDirectory}) {
    if (clearDirectory) {
        await clear(clearDirectory);
    }

    let count       = 0;
    const timestamp = Date.now();

    do {
        const decoder = new MjpegDecoder(stream);
        // just to trigger the stream
        await decoder.takeSnapshot();
        logger.debug(`Waiting ${warmupInterval} ms for warm up`);
        await wait(warmupInterval);

        logger.trace(`Creating snapshot: ${count + 1} of ${max}`);
        const frame = await decoder.takeSnapshot();
        fs.writeFileSync(output.replace('{timestamp}', timestamp).replace('{count}', count), frame);
        logger.info(`Snapshot done: ${count + 1} of ${max}`);

        count++;
        decoder.stop();

        if (count > 0 && count < max && interval > 0) {
            logger.debug(`Waiting ${interval} ms for next snapshot`);
            await wait(interval);
        }
    } while (count < max);
}