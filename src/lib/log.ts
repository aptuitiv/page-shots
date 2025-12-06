/* ===========================================================================
    Console log helper functions
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import logSymbols from 'log-symbols';

/**
 * Log an info message
 *
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logInfo = (message: string, additionalMessage?: string) => {
    if (additionalMessage) {
        fancyLog(
            logSymbols.info,
            chalk.blue(message),
            chalk.cyan(additionalMessage)
        );
    } else {
        fancyLog(logSymbols.info, chalk.blue(message));
    }
};

/**
 * Conditionally log an info message
 *
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logConditionalInfo = (
    outputLog: boolean,
    message: string,
    additionalMessage?: string
) => {
    if (outputLog) {
        logInfo(message, additionalMessage);
    }
};

/**
 * Log a message
 *
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logMessage = (message: string, additionalMessage?: string) => {
    fancyLog(chalk.cyan(message), additionalMessage ?? '');
};

/**
 * Conditionally log a message
 *
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logConditionalMessage = (
    outputLog: boolean,
    message: string,
    additionalMessage?: string
) => {
    if (outputLog) {
        logMessage(message, additionalMessage);
    }
};

/**
 * Log a success message
 *
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logSuccess = (message: string, additionalMessage?: string) => {
    if (additionalMessage) {
        fancyLog(
            logSymbols.success,
            chalk.green(message),
            chalk.cyan(additionalMessage)
        );
    } else {
        fancyLog(logSymbols.success, chalk.green(message));
    }
};

/**
 * Conditionally log a success message
 *
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 * @param {string} [additionalMessage] An additional message to output in cyan
 */
export const logConditionalSuccess = (
    outputLog: boolean,
    message: string,
    additionalMessage?: string
) => {
    if (outputLog) {
        logSuccess(message, additionalMessage);
    }
};

/**
 * Log a warning message
 *
 * @param {string} message The message to output
 */
export const logWarning = (message: string) => {
    fancyLog(logSymbols.warning, chalk.yellow(message));
};

/**
 * Conditionally log a warning message
 *
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 */
export const logConditionalWarning = (outputLog: boolean, message: string) => {
    if (outputLog) {
        logWarning(message);
    }
};

/**
 * Log an error message
 *
 * @param {string} message The message to output
 * @param {Error} [error] The error to output
 */
export const logError = (message: string, error?: Error) => {
    fancyLog(logSymbols.error, chalk.red(message));
    if (error) {
        fancyLog(chalk.red(error.message));
        fancyLog(chalk.red(error.stack));
    }
};

/**
 * Conditionally log an error message
 *
 * @param {boolean} [outputLog] Whether to output the log
 * @param {string} message The message to output
 * @param {Error} [error] The error to output
 */
export const logConditionalError = (
    outputLog: boolean,
    message: string,
    error?: Error
) => {
    if (outputLog) {
        logError(message, error);
    }
};
