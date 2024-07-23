import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default data.version;