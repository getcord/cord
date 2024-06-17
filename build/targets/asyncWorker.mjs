import { rm, buildForNode, outputPath } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['server/src/asyncTier', 'common'],
  clean: async () => rm(outputPath('asyncWorker')),
  build: async () => {
    await buildForNode({
      entryPoints: ['server/src/asyncTier/asyncWorkerMain.ts'],
      outfile: outputPath('asyncWorker/asyncWorker.js'),
      loggingProcessName: 'asyncWorker',
      sentry: {
        project: 'asyncworker', // Sentry project names are all lowercase

        // this is the directory in the Docker containers where the JavaScript
        // bundle is executed from
        prefix: '/radical/dist/generic/asyncWorker/',
      },
      // in production, the node_modules folder is in /radical
      sourceRoot: '/radical/',
    });
  },
};
