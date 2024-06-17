import { rm, buildForNode, copy, outputPath, mode } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['server', 'common', 'opensource'],
  clean: async () =>
    Promise.all([
      rm(outputPath('server/index.js')),
      rm(outputPath('server/localhost.*')),
    ]),
  build: async () => {
    await buildForNode({
      entryPoints: ['server/src/server.ts'],
      outfile: outputPath('server/index.js'),
      loggingProcessName: 'server',
      sentry: {
        project: 'server',

        // this is the directory in the Docker containers where the JavaScript
        // bundle is executed from
        prefix: '/radical/dist/generic/server/',
      },
      // in production, the node_modules folder is in /radical
      sourceRoot: mode === 'production' ? '/radical/' : undefined,
    });

    if (mode === 'development') {
      await copy('localhost/localhost.*', outputPath('server'));
    }

    await copy('server/src/static/dummy_file.txt', outputPath('server'));
  },
};
