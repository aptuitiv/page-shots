module.exports = {
    // Enforce arrow function parenthesis.
    // https://prettier.io/docs/en/options.html#arrow-function-parentheses
    arrowParens: 'always',
    // Match indent to .editorconfig.
    // https://prettier.io/docs/en/options.html#tab-width
    tabWidth: 4,
    // https://prettier.io/docs/en/options.html#semicolons
    semi: true,
    // Use single quotes. Personal preference and it matches the airbnb eslint rules.
    // https://prettier.io/docs/en/options.html#quotes
    singleQuote: true,
    // Consistent linux style line ending.
    // https://prettier.io/docs/en/options.html#end-of-line
    endOfLine: 'lf',
    // Overrides
    // https://prettier.io/docs/en/configuration#configuration-overrides
    overrides: [
        {
            files: '*.css',
            options: {
                // Match indent to .editorconfig.
                // https://prettier.io/docs/en/options.html#tab-width
                printWidth: 120,
            },
        },
    ],
};
