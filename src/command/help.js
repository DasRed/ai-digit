import commandLineUsage from 'command-line-usage';

export default function () {
    console.log(commandLineUsage([
        {
            header:  'Synopsis',
            content: '$ app <options> <command> <command-options>'
        },
        {
            header:  'Command List',
            content: [
                {name: 'run', summary: 'runs the ai over an image'},
                {name: 'prepare', summary: 'prepares the images from the raw section'},
                {name: 'training', summary: 'trains the ai with prepared images and stores the training data'},
                {name: 'dumpConfig', summary: 'dumps the config to output'},
                {name: 'help', summary: 'Display this usage guide.',},
                {name: 'snapshot', summary: 'Creates snapshots from a stream',},
                {name: 'sortSnapshot', summary: 'sort the snapshots to raw directory',},
            ]
        },
        {
            header:     'Options',
            optionList: [
                {
                    name:        'config',
                    alias:       'c',
                    description: 'Defines the config file. Can be a json or json5 file. If not defined, defaults config will be taken.',
                    defaultValue: '/.config.json5',
                    type:        String
                },
                {
                    name:        'help',
                    alias:       'h',
                    description: 'Display this usage guide.',
                    type:        Boolean
                },
                {
                    name:        'verbose',
                    alias:       'v',
                    description: 'Display this usage guide.',
                    type:        Boolean
                },
            ]
        },
        {
            header:     'Run Options',
            optionList: [
                {
                    name:        'input',
                    alias:       'i',
                    description: `Defines the input image.`,
                    type:        String
                },
            ]
        },
    ]));
}
