import logger from '../../logger.js';

/**
 *
 * @param {Sharp} image
 * @param coordinateStart
 * @param positions
 * @param position
 * @returns {Promise<Sharp>}
 */
export default async function (image, {coordinateStart, positions}, {position}) {
    // default of the rect is a coordinate start at "left-top"
    const rect = {
        left:   positions[position].x1,
        top:    positions[position].y1,
        width:  positions[position].x2 - positions[position].x1,
        height: positions[position].y2 - positions[position].y1
    };

    switch (coordinateStart) {
        case 'left-bottom':
            logger.trace(`reading metadata of image`);
            const metadata = await image.metadata();

            logger.trace(`using coordinate start 'left-bottom'`);
            rect.top = metadata.height - rect.top;
            break;

        case 'left-top':
        default:
            logger.trace(`using coordinate start 'left-top'`);
    }

    // create sharp and extract area
    logger.trace(`cropping image`);
    return image.extract(rect);
}