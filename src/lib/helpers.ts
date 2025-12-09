/* ===========================================================================
    Helper functions
=========================================================================== */

import { Page } from 'puppeteer';

/* eslint-disable import/prefer-default-export */

/**
 * Hides the elements on the page that match the given CSS selectors.
 *
 * @param {Page} page The page object
 * @param {string[]} selectors The array of CSS selectors to hide
 * @returns {Promise<void>} A promise that resolves when the elements have been hidden
 */
export const hideElements = async (
    page: Page,
    selectors: string[]
): Promise<void> => {
    const promises = [];
    selectors.forEach((selector) => {
        promises.push(
            page.evaluate((sel) => {
                document.querySelectorAll(sel).forEach((element) => {
                    // eslint-disable-next-line no-param-reassign -- Must set display to none to hide the element
                    (element as HTMLElement).style.display = 'none';
                });
            }, selector)
        );
    });
    await Promise.all(promises);
};
