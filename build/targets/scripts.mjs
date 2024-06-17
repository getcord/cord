import { rm, buildForNode, outputPath } from '../util.mjs'; // eslint-disable-line no-restricted-imports

export default (input) => {
  const basename = input.endsWith('.ts')
    ? input.substring(0, input.length - 3)
    : input;
  const output = outputPath(`${basename}.js`);

  return {
    name: input,
    watch: [input],
    clean: () => rm(output),
    build: () =>
      buildForNode({
        entryPoints: [input],
        outfile: output,
        loggingProcessName: `${basename.replace(/[-/]/g, '_')}`,
        sourcemap: 'inline',
      }),
  };
};
