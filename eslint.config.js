/**
 * This is used with linting files in this package.
 * It is not used for linting files for the website that is using
 * these build tools. That configuration is on the src/javascript.js file.
 */

// eslint-disable-next-line import-x/no-extraneous-dependencies -- This library is only used for development so it should be in devDependencies
import aptuitivEslint from '@aptuitiv/eslint-config-aptuitiv';
// eslint-disable-next-line import-x/no-extraneous-dependencies -- This library is only used for development so it should be in devDependencies
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from 'typescript-eslint';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'

export default defineConfig([
    // Because @aptuitiv/eslint-config-aptuitiv exports an array of objects, we need to use the spread operator.
    ...aptuitivEslint,
    // Custom TypeScript ESLint rules
    ...tseslint.configs.recommended,
    // Ignore the docs directory
    globalIgnores(['docs/',]),
    // Custom rules for this project
    {
        rules: {
            // Allow importing Javascript files
            'import-x/extensions': ['off'],
        },
        settings: {
            'import-x/resolver-next': [
                createTypeScriptImportResolver({
                    // Always try to resolve types under `<root>@types` directory even if it doesn't contain any source code, like `@types/unist`
                    alwaysTryTypes: true,
                }),
            ],
        }
    },
]);
