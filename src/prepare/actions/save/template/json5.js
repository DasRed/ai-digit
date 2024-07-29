const BLOCKS = [
    {from: 0, to: 0.2, char: ' ',},
    {from: 0.2, to: 0.4, char: '░',},
    {from: 0.4, to: 0.6, char: '▒',},
    {from: 0.6, to: 0.8, char: '▓',},
    {from: 0.8, to: 1, char: '█',},
];

/**
 * @param {*[]} array
 */
export default (array, info, invert) => `
{
    ${info.meta.channels !== 1 ? '' : `
    /*
        ╔${'═'.repeat(info.meta.width)}╗
        ║${array.reduce((acc, value, index) => {
            const realChannels = array.length / (info.meta.width * info.meta.height);
            if (index % realChannels !== 0) {
                return acc;
            }

            if (invert === false) {
                value = 1 - value; 
            }
            
            const block = BLOCKS.find(({from, to}) => from <= value && value <= to);
            if (index === 0) {
                acc += block.char;
            }
            else if (index % info.meta.width === 0) {
                acc += '║\n        ║' + block.char;
            }
            else {
                acc += block.char;
            }
        
            return acc;
        }, '')}║
        ╚${'═'.repeat(info.meta.width)}╝
    */
    `}
    number: ${info.number},
    position: '${info.position}',
    file: '${info.fileSource}', 
    meta: {
        width: ${info.meta.width},
        height: ${info.meta.height},
        size: ${info.meta.size},
        space: '${info.meta.space}',
        channels: ${info.meta.channels},
    },
    arrayLength: ${array.length},
    array: [${array.join(',')}]
}
`