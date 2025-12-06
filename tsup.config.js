/* ===========================================================================
    Configuration for the tsup command
    https://tsup.egoist.dev/#using-custom-configuration
=========================================================================== */

import { defineConfig } from 'tsup'
import eslint from 'esbuild-plugin-eslint';

// Most of these options are pushed to esbuild.
export default defineConfig([
    // ESM build for importing in other projects
    {
        dts: true, // Enable Typescript dts generation
        entry: ['src/index.ts'],
        esbuildPlugins: [
            eslint({
                fix: true
            })
        ],
        format: 'esm',
        minify: false,
        outDir: 'dist',
        platform: 'node',
    }
])
