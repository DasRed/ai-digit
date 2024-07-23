import fs from 'fs';

export default async function (image, file) {
    const array = await image.raw().toArray();
    const data  = Array.from(array[0]);
    const max   = Math.max(...data);

    fs.writeFileSync(file, JSON.stringify(data.map((value) => value / max), null, 4));

    return true;
}