/* ===========================================================================
    Time library
=========================================================================== */

/**
 * Gets the start time
 *
 * @returns {bigint} The start time
 */
export function getStartTime(): bigint {
    return process.hrtime.bigint();
}

/**
 * Converts a hrtime to a number of seconds
 *
 * @param {bigint} startTime The hrtime to convert
 * @returns {string} The number of seconds as a string
 */
export function getElapsedTime(startTime: bigint): string {
    const endTime = process.hrtime.bigint();
    const startTimeNumber = Number(startTime);
    const endTimeNumber = Number(endTime);
    const elapsedTime = endTimeNumber - startTimeNumber;
    return (elapsedTime / 1000000000).toFixed(4);
}
