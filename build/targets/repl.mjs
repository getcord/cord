import { rm, buildForNode, outputPath } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['server', 'common', 'repl'],
  clean: async () => rm(outputPath('repl/index.js')),
  build: async () => {
    await buildForNode({
      entryPoints: ['repl/repl.ts'],
      outfile: outputPath('repl/index.js'),
      loggingProcessName: 'repl',
    });
  },
};
