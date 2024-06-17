import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const argv = yargs(hideBin(process.argv))
  .strict()
  .option('target', {
    type: 'string',
    description:
      'which target(s) to build (comma-separated list of target names)',
  })
  .option('mode', {
    type: 'string',
    description: "build mode ('development' or 'production')",
    default: 'production',
  })
  .option('watch', {
    type: 'boolean',
    description: 'run in the background and rebuild when source files change',
  })
  .option('clean', {
    type: 'boolean',
    description: 'remove old build artifacts first',
  })
  .option('metafile', {
    type: 'boolean',
    description:
      'build esbuild metafiles for javascript files, for use at https://esbuild.github.io/analyze/',
    default: false,
  })
  .option('skipInitialBuild', {
    type: 'boolean',
    description:
      'if combined with --watch, skip the initial build and only build once ' +
      'source file changes have been detected',
  })
  .help()
  .alias('help', 'h').argv;

if (argv.mode !== 'development' && argv.mode !== 'production') {
  console.error('mode must be set to development or production');
  process.exit(1);
}
