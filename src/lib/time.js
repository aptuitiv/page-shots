/* ===========================================================================
    Time library
=========================================================================== */

/**
 * Gets the start time
 * 
 * @returns {bigint} The start time
 */
export function getStartTime() {
    return process.hrtime.bigint();
}

/**
 * Converts a hrtime to a number of seconds
 * 
 * @param {bigint} startTime The hrtime to convert
 * @returns {number} The number of seconds
 */
export function getElapsedTime(startTime) {
    const endTime = process.hrtime.bigint();
    const startTimeNumber = Number(startTime);
    const endTimeNumber = Number(endTime);
    const elapsedTime = endTimeNumber - startTimeNumber;
    return parseFloat(elapsedTime / 1000000000).toFixed(4);
}