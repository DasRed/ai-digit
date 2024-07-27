import commandLineArgs from 'command-line-args';
import commands from './command/index.js';
import configParser from './configParser.js';
import logger from './logger.js';
import version from './version.js';

const options = commandLineArgs([
    {name: 'commands', type: String, defaultOption: true, defaultValue: 'run', multiple: true},
    {name: 'help', alias: 'h', type: Boolean},
    {name: 'verbose', alias: 'v', type: Boolean, lazyMultiple: true},

    {name: 'input', alias: 'i', type: String},
    {name: 'config', alias: 'c', type: String, defaultValue: './config.json5'},
]);

if (options.verbose?.length === 1) {
    logger.level = 'debug';
}
if (options.verbose?.length > 1) {
    logger.level = 'trace';
}

if (options.help) {
    options.commands = ['help'];
}

logger.trace(`AI Digit ${version}`);
await options.commands.reduce(async (promise, command) => {
    await promise;
    logger.debug(`running command "${command}"`);

    const config = configParser(options);
    await commands[command](config[command] ?? config, config);
    logger.debug(`command "${command}" finished`);

}, Promise.resolve());
logger.trace(`finished`);
