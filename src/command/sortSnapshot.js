import fs from 'fs';
import path from 'path';
import logger from '../logger.js';

export default function ({output, delete: deleteSource, overwrite, files}) {
    Object.entries(files).forEach(([file, data]) => {
        logger.trace(`Handle ${file}`);

        data.forEach((value, line) => value.split('').forEach((number, position) => {
            if (number === ' ') {
                return;
            }

            const dest = output.replace('{number}', number)
                               .replace('{line}', line + 1)
                               .replace('{position}', position + 1)
                               .replace('{file}', path.basename(file));

            if (overwrite === false && fs.existsSync(dest) === true) {
                logger.warn(`can not handle file ${file}, because destination file ${dest} exists!`);
                return
            }

            fs.cpSync(file, dest);
            logger.trace(`File ${file} copied to ${dest}`);
        }));

        if (deleteSource === true) {
            fs.unlinkSync(file);
            logger.trace(`${file} deleted.`);
        }

        logger.debug(`${file} done`);
    });
    logger.info('Snapshot sort finished.');
}
