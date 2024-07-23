export default async function (image, file) {
    await image.toFile(file);
    return true;
}