#!/usr/bin/env -S node -r dotenv/config

import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin'; // eslint-disable-line no-restricted-imports
import * as esbuild from 'esbuild';
import pkg from '../opensource/sdk-js/package.json' assert { type: 'json' }; // eslint-disable-line no-restricted-imports

/**
 * Create a single CSS file containing all our opensource components' CSS.
 * The file is either served locally when in dev mode, or uploaded to S3.
 *
 * That file will then be added to the page by the CordSDK running in the browser,
 * (just like it happens for latest.css)
 */
export async function bundleCSS() {
  try {
    let result = await esbuild.build({
      entryPoints: ['opensource/sdk-js/packages/react/index.ts'],
      write: false, // Do not write to disk. Instead, we'll upload to S3.
      outfile: `v${pkg.version}.js`,
      // Same config as our main build
      bundle: true,
      minify: true,
      target: ['es2019', 'chrome90', 'firefox88', 'safari14.1', 'edge90'],
      platform: 'browser',
      plugins: [vanillaExtractPlugin()],
    });

    const [_jsBundle, cssBundle] = result.outputFiles;
    return { css: cssBundle.text, pkgVersion: pkg.version };
  } catch (error) {
    console.error(error);
  }
}
