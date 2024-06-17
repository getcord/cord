// eslint-disable-next-line no-restricted-imports
import { mode, rm, buildForNode, copy, outputPath } from '../util.mjs';

export default {
  watch: ['common', 'docs', 'opensource/sample-apps', 'server'],
  clean: async () => rm(outputPath('docs/server')),
  build: async () => {
    await buildForNode({
      entryPoints: ['docs/server/index.ts'],
      outfile: outputPath('docs/server/index.js'),
      loggingProcessName: 'docsServer',
      sentry: {
        project: 'docs-server',

        // this is the directory in the Docker containers where the JavaScript
        // bundle is executed from
        prefix: '/radical/dist/generic/docs/',
      },
    });

    if (mode === 'development') {
      await copy('localhost/localhost.*', outputPath('docs/server'));
    }
  },
};
