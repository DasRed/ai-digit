import logger from '../logger.js';

export default (config) => logger.info(JSON.stringify(config, null, 4));
