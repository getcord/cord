import * as fs from 'fs';

import { bundleCSS } from '../../scripts/bundle-CSS.mjs'; // eslint-disable-line no-restricted-imports
import { CORD_REACT_COMPONENTS_CSS_FILENAME } from '../const.mjs'; // eslint-disable-line no-restricted-imports
import { rm, buildForBrowser, outputPath, copy, mode } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['sdk', 'external', 'common', 'opensource'],
  clean: async () =>
    Promise.all([rm(outputPath('external')), rm(outputPath('sdk-test'))]),
  build: async () => {
    await fs.promises.mkdir(outputPath(`external`), { recursive: true });
    if (!process.env.INCLUDE_SDK_TESTBED) {
      await fs.promises.mkdir(outputPath(`sdk-test`), { recursive: true });
    } else {
      await fs.promises.mkdir(outputPath(`external/sdk/test`), {
        recursive: true,
      });
    }
    // Copy static files into destination directories
    await Promise.all([
      copy('external/src/static', outputPath('external')),
      copy(
        'external/src/entrypoints/app/static/index.html',
        outputPath('external'),
      ),
      copy('external/src/entrypoints/app/robots.txt', outputPath('external')),
      copy(
        'external/src/lib/auth/auth-complete/index.html',
        outputPath('external/auth-complete.html'),
      ),
      copy(
        'external/src/lib/auth/auth-error/index.html',
        outputPath('external/auth-error.html'),
      ),
      copy(
        'external/src/lib/auth/auth-slack-linking-start/index.html',
        outputPath('external/auth-slack-linking-start.html'),
      ),
      copy(
        'external/src/lib/auth/auth-slack-linking-error/index.html',
        outputPath('external/auth-slack-linking-error.html'),
      ),
      copy(
        'external/src/lib/auth/auth-puppet-complete/index.html',
        outputPath('external/auth-puppet-complete.html'),
      ),
      copy(
        'external/src/lib/auth/monday-connect/index.html',
        outputPath('external/monday-connect.html'),
      ),
      copy(
        'sdk/test/index.html',
        outputPath(
          process.env.INCLUDE_SDK_TESTBED
            ? 'external/sdk/test/index.html'
            : 'sdk-test/index.html',
        ),
      ),
      copy(
        'sdk/test/empty.html',
        outputPath(
          process.env.INCLUDE_SDK_TESTBED
            ? 'external/sdk/test/empty.html'
            : 'sdk-test/empty.html',
        ),
      ),
    ]);

    const nativeScreenshotWorker = await buildForBrowser({
      entryPoints: ['external/src/lib/nativeScreenshot/worker/index.ts'],
    });

    const [cssBundle] = await Promise.all([
      bundleCSS(),
      buildForBrowser({
        entryPoints: ['sdk/client/core/script.ts'],
        outfile: outputPath('external/sdk/v1/sdk.latest.js'),
        outfileCSS: outputPath('external/sdk/v1/sdk.latest.css'),
        define: {
          workerCode: JSON.stringify(
            Buffer.from(nativeScreenshotWorker.js, 'utf8').toString('base64'),
          ),
        },
        deployment: 'sdk',
        sentry: {
          project: 'sdk',
          prefix: `https://${process.env.APP_SERVER_HOST}/sdk/v1`,
        },
      }),
      buildForBrowser({
        entryPoints: ['sdk/client/core/iframe/script.ts'],
        outfile: outputPath('external/sdk/v1/iframe.js'),
        define: {
          workerCode: JSON.stringify(
            Buffer.from(nativeScreenshotWorker.js, 'utf8').toString('base64'),
          ),
        },
      }),
      buildForBrowser({
        entryPoints: ['sdk/test/index.tsx'],
        define: {
          CORD_REACT_PACKAGE_VERSION: JSON.stringify('dev'),
        },
        outfile: outputPath(
          process.env.INCLUDE_SDK_TESTBED
            ? 'external/sdk/test/index.js'
            : 'sdk-test/index.js',
        ),
        outfileCSS: outputPath(
          process.env.INCLUDE_SDK_TESTBED
            ? 'external/sdk/test/index.css'
            : 'sdk-test/index.css',
        ),
      }),
      buildForBrowser({
        entryPoints: ['sdk/test/empty.tsx'],
        define: {
          CORD_REACT_PACKAGE_VERSION: JSON.stringify('dev'),
        },
        outfile: outputPath(
          process.env.INCLUDE_SDK_TESTBED
            ? 'external/sdk/test/empty.js'
            : 'sdk-test/empty.js',
        ),
      }),
      buildForBrowser({
        entryPoints: ['external/src/lib/auth/auth-complete/index.ts'],
        outfile: outputPath('external/auth-complete.js'),
      }),
      buildForBrowser({
        entryPoints: ['external/src/lib/auth/auth-error/index.ts'],
        outfile: outputPath('external/auth-error.js'),
      }),
      buildForBrowser({
        entryPoints: [
          'external/src/lib/auth/auth-slack-linking-start/index.ts',
        ],
        outfile: outputPath('external/auth-slack-linking-start.js'),
      }),
      buildForBrowser({
        entryPoints: [
          'external/src/lib/auth/auth-slack-linking-error/index.ts',
        ],
        outfile: outputPath('external/auth-slack-linking-error.js'),
      }),
      buildForBrowser({
        entryPoints: ['external/src/lib/auth/auth-puppet-complete/index.ts'],
        outfile: outputPath('external/auth-puppet-complete.js'),
      }),
      buildForBrowser({
        entryPoints: ['external/src/lib/auth/monday-connect/index.ts'],
        outfile: outputPath('external/monday-connect.js'),
      }),
    ]);

    if (cssBundle) {
      await fs.promises.mkdir(outputPath(`external/sdk/css`), {
        recursive: true,
      });
      await fs.promises.writeFile(
        outputPath(`external/sdk/css/${CORD_REACT_COMPONENTS_CSS_FILENAME}`),
        cssBundle.css,
      );
    }

    if (mode === 'development') {
      // needed to get non-root routes to work on localhost which uses the http-server package
      await copy(
        outputPath('external/index.html'),
        outputPath('external/404.html'),
      );
    }
  },
};
