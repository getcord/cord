import { rm, buildForBrowser, copy, outputPath } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['external', 'common'],
  clean: async () => rm(outputPath('server/console')),
  build: async () => {
    await buildForBrowser({
      entryPoints: ['external/src/entrypoints/console/index.tsx'],
      outfile: outputPath('server/console/main.js'),
      define: {
        CORD_REACT_PACKAGE_VERSION: '"console"',
      },
    });
    await copy(
      'external/src/entrypoints/console/static',
      outputPath('server/console/'),
    );
    await copy(
      'external/src/entrypoints/console/static/index.html',
      outputPath('server/console/'),
    );
  },
};
