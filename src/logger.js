import pino from 'pino';
import pretty from 'pino-pretty'

const logger = pino(pretty({
    colorize:   true,
    ignore:     'pid,hostname',
    sync:       true,
    singleLine: true,
}));

logger.level = 'info';

export default logger;