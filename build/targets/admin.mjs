import { promises as fs } from 'fs';
import { rm, buildForBrowser, copy, outputPath, replace } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['external', 'common', 'sdk', 'opensource'],
  clean: async () => rm(outputPath('server/admin')),
  build: async () => {
    await fs.mkdir(outputPath('server/admin/tests'), {
      recursive: true,
    });
    await buildForBrowser({
      entryPoints: ['external/src/entrypoints/admin/index.tsx'],
      define: {
        CORD_REACT_PACKAGE_VERSION: '"admin"',
      },
      outfile: outputPath('server/admin/main.js'),
      sentry: {
        project: 'admin',
        prefix: `https://${process.env.ADMIN_SERVER_HOST}`,
      },
    });

    await copy(
      'external/src/entrypoints/admin/static',
      outputPath('server/admin/'),
    );
    await copy(
      'external/src/entrypoints/admin/static/index.html',
      outputPath('server/admin/'),
    );

    await copy(
      'external/src/entrypoints/sdk-health/index.html',
      outputPath('server/admin/tests/index.html'),
    );

    await buildForBrowser({
      entryPoints: ['external/src/entrypoints/sdk-health/index.ts'],
      outfile: async () => {
        const sdkpath = `https://${process.env.APP_SERVER_HOST}/sdk/v1/sdk.latest.js`;
        await replace(
          outputPath('server/admin/tests/index.html'),
          '%SDK-SRC%',
          sdkpath,
        );
        return outputPath('server/admin/tests/sdk-health.js');
      },
    });

    await copy(
      'external/src/entrypoints/admin/components/crt/CustomerThread/index.html',
      outputPath('server/admin/customer-thread.html'),
    );
    await buildForBrowser({
      entryPoints: [
        'external/src/entrypoints/admin/components/crt/CustomerThread/index.tsx',
      ],
      define: {
        CORD_REACT_PACKAGE_VERSION: '"admin"',
      },
      outfile: outputPath('server/admin/customer-thread.js'),
    });
  },
};
