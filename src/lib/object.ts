/* ===========================================================================
    Object utility functions
=========================================================================== */

/*  eslint-disable @typescript-eslint/no-explicit-any  */

import {
    isNumberOrNumberString,
    isObject,
    isStringWithValue,
} from './types.js';

/**
 * Tests to see if the object is a valid object and if the key is a valid key
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @returns {boolean}
 */
export const objectHasValue = (obj: any, key: string): boolean =>
    isObject(obj) && key in obj;

/**
 * Tests to see if the object is a valid object and if the key is a valid key and if the key value is an array
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @returns {boolean}
 */
export const objectValueIsArray = <T>(obj: T, key: string): obj is T =>
    objectHasValue(obj, key) && Array.isArray(obj[key]);

/**
 * Tests to see if the object is a valid object and if the key is a valid key and if the key value is a number or number string
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @returns {boolean}
 */
export const objectValueIsNumberOrNumberString = <T>(
    obj: T,
    key: string
): obj is T => objectHasValue(obj, key) && isNumberOrNumberString(obj[key]);

/**
 * Tests to see if the object is a valid object and if the key is a valid key and if the key value is a string
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @returns {boolean}
 */
export const objectValueIsString = <T>(obj: T, key: string): obj is T =>
    objectHasValue(obj, key) && typeof obj[key] === 'string';

/**
 * Tests to see if the object is a valid object and if the key is a valid key and if the key value is a string with a value
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @returns {boolean}
 */
export const objectValueIsStringWithValue = <T>(
    obj: T,
    key: string
): obj is T => objectHasValue(obj, key) && isStringWithValue(obj[key]);

/**
 * Tests to see if the object is a valid object and if the key is a valid key and if the key value
 * matches the value
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @param {any} value The value to test the object value against
 * @returns {boolean}
 */
export const objectValueIs = (obj: any, key: string, value: any): boolean =>
    objectHasValue(obj, key) && obj[key] === value;

/**
 * Tests to see if the object is a valid object and if the key is a valid key and if the key value
 * is one of the passed values
 *
 * @param {any} obj The object to test
 * @param {string} key The object key to test
 * @param {Array} values The array of string values to test agains
 * @returns {boolean}
 */
export const objectValueIn = (
    obj: any,
    key: string,
    values: string[]
): boolean => objectHasValue(obj, key) && values.includes(obj[key]);
