/* ===========================================================================
Utility functions for determining a variable's type and if it can be used
=========================================================================== */

/**
 * Returns if the value is true like
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isFalseLike = (thing) => ['n', 'no', false, 'false'].includes(thing);

/**
 * Returns if the value is true like
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isTrueLike = (thing) => ['y', 'yes', true, 'true'].includes(thing);

/**
 * Returns if the value is a boolean-like value
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isBoolLike = (thing) => isTrueLike(thing) || isFalseLike(thing);

/**
 * Returns if the value is boolean
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isBoolean = (thing) => typeof thing === 'boolean';

/**
 * Returns if the value is defined
 *
 * Template trick from: https://stackoverflow.com/a/62753258
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isDefined = (thing) => typeof thing !== 'undefined';

/**
 * Returns if the value is a valid number
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isNumber = (thing) =>
    !Number.isNaN(thing) && typeof thing === 'number' && thing !== Infinity;

/**
 * Returns if the given value is a string that represents a numerical value
 *   e.g. returns true for `"34"` and false for `"text34"` and `34`
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isNumberString = (thing) =>
    typeof thing === 'string' && thing.trim().length > 0 && !Number.isNaN(Number(thing)) && thing !== 'Infinity';

/**
 * Returns if the given value is a number or string that represents a numerical value
 *   e.g. returns true for 34 or "34" and false for "text34" and "text"
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isNumberOrNumberString = (thing) => isNumber(thing) || isNumberString(thing);

/**
 * Returns if the value is an object
 *
 * https://attacomsian.com/blog/javascript-check-variable-is-object
 * 
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isObject = (thing) =>
    Object.prototype.toString.call(thing) === '[object Object]';

/**
 * Returns if the value is an object
 *
 * https://attacomsian.com/blog/javascript-check-variable-is-object
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isObjectWithValues = (thing) => Object.prototype.toString.call(thing) === '[object Object]'
    && Object.keys(thing).length > 0;

/**
 * Returns if the value is a string
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isString = (thing) => typeof thing === 'string';

/**
 * Returns if the value is string and has a length greater than 0
 *
 * @param {any} thing The value to test
 * @returns {boolean}
 */
export const isStringWithValue = (thing) => isString(thing) && thing.trim().length > 0;
