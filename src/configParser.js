import deepmerge from 'deepmerge';
import fs from 'fs';
import JSON5 from 'json5';
import logger from './logger.js';

export default function ({config: configFile = './config-defaults.json5'}) {
    logger.trace(`parsing config file ${configFile}`);
    const configData = JSON5.parse(fs.readFileSync(configFile, 'utf-8'));

    logger.trace(`parsing default config file`);
    const defaultConfigData = JSON5.parse(fs.readFileSync('./config-defaults.json5', 'utf-8'));

    const config = deepmerge(defaultConfigData, configData);
    logger.trace(`config parsed and created`);

    return config;
};