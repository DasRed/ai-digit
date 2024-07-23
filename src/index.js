import commandLineArgs from 'command-line-args';
import command from './command/index.js';
import configParser from './configParser.js';
import logger from './logger.js';
import version from './version.js';

const options = commandLineArgs([
    {name: 'command', type: String, defaultOption: true, defaultValue: 'run'},
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
    options.command = 'help'
}

if (command[options.command] === undefined) {
    options.command = 'help';
}

logger.trace(`AI Digit ${version}`);
logger.trace(`running command "${options.command}"`);

const config = configParser(options);
await command[options.command](config[options.command] ?? config);

logger.trace(`finished`);
