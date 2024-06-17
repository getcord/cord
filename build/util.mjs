import util from 'util';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import child_process from 'child_process';
import esbuild from 'esbuild';
import graphqlLoaderPlugin from '@luckycatfactory/esbuild-graphql-loader';
import svgrPlugin from 'esbuild-plugin-svgr';
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin'; // eslint-disable-line no-restricted-imports
import { argv } from './argv.mjs'; // eslint-disable-line no-restricted-imports
import { SENTRY_DSNS } from './const.mjs'; // eslint-disable-line no-restricted-imports

export const mode = argv.mode;
const exec = util.promisify(child_process.exec);

const packageJSON = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);

export const externalDependencies = [
  ...Object.keys(packageJSON.dependencies),
  ...Object.keys(packageJSON.devDependencies),
];

export const /** @type string */ packageVersion = packageJSON.version;
let version;
export const refreshVersion = () => {
  version =
    mode === 'development' ? `dev-${Date.now().toString()}` : packageVersion;
};
export const getVersion = () => version;
export const versionPath = mode === 'development' ? 'dev' : packageVersion;

// This is a list of fields of the environment (which this build tool reads from
// the .env file) that are made available to browser JavaScript bundles in
// addition to NODE_ENV. Make sure to include only fields that are safe to
// expose. For example: 'CORD_TIER' is okay, 'POSTGRES_PASSWORD' most
// certainly not.
// Everything in requiredBrowserEnvFields *must* be defined at compile time, the
// fields in optionalBrowserEnvFields may be undefined.
const requiredBrowserEnvFields = [
  'CORD_TIER',
  'JIRA_APP_CLIENT_ID',
  'ASANA_APP_CLIENT_ID',
  'LINEAR_APP_CLIENT_ID',
  'MONDAY_APP_CLIENT_ID',
  'TOP_SERVER_HOST',
  'APP_SERVER_HOST',
  'API_SERVER_HOST',
  'API_SERVER_HOST_PRODUCTION',
  'ADMIN_SERVER_HOST',
  'CONSOLE_SERVER_HOST',
  'MARKETING_SERVER_HOST',
  'DOCS_SERVER_HOST',
  'COMMUNITY_SERVER_HOST',
  'CORD_TO_HOST',
  'AUTH0_CUSTOM_LOGIN_DOMAIN',
  'AUTH0_CLIENT_ID',
  'DOCS_AI_CHATBOT_SERVER_HOST',
];
const optionalBrowserEnvFields = [
  'SENTRY_ENVIRONMENT',
  'SENTRY_RELEASE',
  'SENTRY_TRACE_SAMPLE_RATE',
  'INCLUDE_SDK_TESTBED',
  'SLACK_APP_REDIRECT_HOST',
];

export const rm = async (pathToRm) => exec(`rm -rf ${pathToRm}`);

export const buildForBrowser = async ({
  define,
  deployment = null,
  ...rest
}) => {
  return build({
    platform: 'browser',
    bundle: true,
    // These should match the supported browsers in our documentation
    // (https://docs.cord.com/in-depth/browser-support/ as of March 2023)
    target: ['es2019', 'chrome90', 'firefox88', 'safari14.1', 'edge90'],
    minify: mode === 'production',
    plugins: [
      graphqlLoaderPlugin.default(),
      svgrPlugin(),
      vanillaExtractPlugin(),
    ],

    // This alias *looks* like a no-op, but it has an important side effect:
    // esbuild looks up aliased modules relative to the working directory (in
    // our case, the monorepo root) as opposed to relative to the file which did
    // the original import. So this alias means that we always use react from
    // monorepo/node_modules and not some other react that might be sitting
    // around somewhere, e.g., in opensource/sdk-js/node_modules. React really
    // does not like "crossing the streams" like this (in a similar fashion to
    // ABI issues in C if you include different versions of the same lib) so we
    // do this to enforce consistency.
    alias: { react: 'react' },

    ...rest,
    define: {
      global: 'globalThis',
      'BUILDCONSTANTS.version': JSON.stringify(version),
      'BUILDCONSTANTS.versionPath': JSON.stringify(versionPath),
      'BUILDCONSTANTS.deployment': JSON.stringify(deployment),
      'process.env.NODE_ENV': JSON.stringify(mode),
      ...Object.fromEntries([
        ...requiredBrowserEnvFields.map((key) => {
          const value = process.env[key];
          if (value === undefined) {
            throw new Error(
              `${key} must be defined in the process environment`,
            );
          }
          if (value.indexOf('!!SECRET!') >= 0) {
            throw new Error(`${key} contains a SECRET placeholder`);
          }
          return [`process.env.${key}`, JSON.stringify(value)];
        }),
        ...optionalBrowserEnvFields.map((key) => {
          const value = process.env[key];
          if (value && value.indexOf('!!SECRET!') >= 0) {
            throw new Error(`${key} contains a SECRET placeholder`);
          }
          return [
            `process.env.${key}`,
            value === undefined ? 'undefined' : JSON.stringify(value),
          ];
        }),
      ]),
      ...(define || {}),
    },
  });
};

export const buildForNode = async ({ loggingProcessName, define, ...rest }) => {
  return build({
    platform: 'node',
    bundle: true,
    format: 'esm',
    target: 'node18',
    minify: false,
    plugins: [
      graphqlLoaderPlugin.default(),
      svgrPlugin(),
      vanillaExtractPlugin(),
    ],
    external: externalDependencies,
    ...rest,
    define: {
      'BUILDCONSTANTS.loggingProcessName': JSON.stringify(loggingProcessName),
      ...define,
    },
  });
};

async function build({ outfile, outfileCSS, sentry, define, ...options }) {
  // We always produce sourcemaps when in development mode or when building
  // bundles for the server (i.e. for Node). In production mode only, if we have
  // set a `sentry` field on the target.
  // We add a special comment to the end of the JavaScript bundle that
  // references the sourcemap file, if we are in development mode or we are
  // producing a server bundle. The point is that we don't want this comment in
  // JavaScript bundles that are publicly accessible (i.e. browser bundles in
  // production mode)
  const addSourcemapReference =
    mode === 'development' || options.platform === 'node';
  const sourcemap = addSourcemapReference || sentry ? 'external' : false;

  const virtualOutputPath = path.resolve('output.js');

  const sentryDSN =
    sentry && sentry.project ? SENTRY_DSNS[sentry.project] : undefined;
  const esbuildResult = await esbuild.build({
    define: {
      'BUILDCONSTANTS.sentryDSN':
        sentryDSN === undefined ? 'undefined' : JSON.stringify(sentryDSN),
      ...define,
    },
    ...options,
    sourcemap,
    jsx: 'automatic',
    metafile: argv.metafile,

    // Tell esbuild not to write the output to disk - we take care of that here
    // below. We also provide a faux output file name.
    outfile: virtualOutputPath,
    write: false,
  });

  const result = {};

  // Go through all the output files that esbuild gave us. They have not been
  // written to disk by esbuild.
  for (const { path: outPath, text } of esbuildResult.outputFiles) {
    if (outPath === virtualOutputPath) {
      // This is the generated JavaScript bundle.
      result.js = text;
    } else if (outPath === `${virtualOutputPath}.map`) {
      result.jsmap = text;
    } else if (outPath === `${virtualOutputPath.replace(/\.js$/, '')}.css`) {
      result.css = text;
    } else if (outPath === `${virtualOutputPath.replace(/\.js$/, '')}.js.css`) {
      // do nothing;
    } else if (
      outPath === `${virtualOutputPath.replace(/\.js$/, '')}.css.map`
    ) {
      // do nothing;
    } else {
      console.warn(`esbuild returned output with unknown path: ${outPath}`);
    }
  }

  if (!('js' in result)) {
    throw new Error('esbuild did not return JavaScript output');
  }

  if (result.css && outfileCSS) {
    await fs.promises.mkdir(path.dirname(outfileCSS), { recursive: true });
    await fs.promises.writeFile(outfileCSS, result.css);
  }

  // `outfile` may be passed to this function in the form of a string or a
  // function. If it's a function we call it with two arguments (an md5 hash as
  // hex string and the full content of the JavaScript bundle as a string). The
  // function can return a string to tell us where to save the JavaScript
  // bundle.
  if (typeof outfile === 'function') {
    const md5 = crypto
      .createHash('md5')
      .update(Buffer.from(result.js, 'utf-8'))
      .digest('hex');
    outfile = await outfile(md5, result.js);
  }

  if (typeof outfile === 'string') {
    const outpath = outfile;
    const basename = path.basename(outfile);
    result.outpath = outpath;
    await fs.promises.mkdir(path.dirname(outpath), { recursive: true });

    if (result.jsmap) {
      // If a sentryArtifactPath is defined in the build target, we put JavaScript
      // bundle and sourcemap into a sourcemaps directory.
      const artifactsDir = sentry
        ? outputPath(`sourcemaps${sentry.project ? `/${sentry.project}` : ''}`)
        : null;
      if (artifactsDir) {
        await fs.promises.mkdir(artifactsDir, { recursive: true });
        await unlink(`${artifactsDir}/${basename}`);
        await unlink(`${artifactsDir}/${basename}.map`);

        // Construct the command line for uploading source maps to Sentry, but
        // only if the SENTRY_RELEASE variable is set (we can only upload files
        // to Sentry for a specific release)
        const sentryUploadCommandLine = process.env.SENTRY_RELEASE
          ? [
              'sentry-cli',
              'releases',
              '--org',
              'cord',
              ...(sentry.project
                ? ['--project', shellEscape(sentry.project)]
                : []),
              'files',
              process.env.SENTRY_RELEASE,
              'upload-sourcemaps',
              ...(sentry.prefix
                ? ['--url-prefix', shellEscape(sentry.prefix)]
                : []),
              shellEscape(basename),
              shellEscape(`${basename}.map`),
            ].join(' ') + '\n'
          : '';

        await fs.promises.writeFile(
          `${artifactsDir}/${basename}.upload`,
          sentryUploadCommandLine,
        );

        // Put the JavaScript bundle into the sourcemaps directory (in the form
        // of a symlink)
        await fs.promises.symlink(
          path.relative(artifactsDir, outpath),
          `${artifactsDir}/${basename}`,
        );
      }

      if (addSourcemapReference) {
        // This the case where we add a special comment at the end of the
        // JavaScript bundle to reference the sourcemap. We do this for local
        // development and also for server code bundles in production. We don't
        // do this for browser bundles in production, because we don't want the
        // whole world to access our sourcemaps, which contains all our source
        // code.
        result.js += `\n//# sourceMappingURL=${basename}.map\n`;

        const sourcemapPath = `${outpath}.map`;
        await fs.promises.writeFile(sourcemapPath, result.jsmap);

        if (artifactsDir) {
          // If a sentry field was defined in the build target, we put a symlink
          // into the sourcemaps folder for later upload to Sentry.
          await fs.promises.symlink(
            path.relative(artifactsDir, sourcemapPath),
            `${artifactsDir}/${basename}.map`,
          );
        }
      } else if (artifactsDir) {
        // If the JavaScript does not contain a reference to the sourcemap, then we
        // only store it in the sourcemaps folder.
        await fs.promises.writeFile(
          `${artifactsDir}/${basename}.map`,
          result.jsmap,
        );
      }
    }

    // If the JavaScript output starts with a hashbang ('#!'), then it's a
    // script file that should be executable
    const isExecutable = result.js.startsWith('#!');

    const filesToWrite = [
      fs.promises.writeFile(
        outpath,
        result.js,
        isExecutable ? { mode: 0o777 } : {},
      ),
    ];
    if (esbuildResult.metafile) {
      filesToWrite.push(
        fs.promises.writeFile(
          `${outpath}.meta`,
          JSON.stringify(esbuildResult.metafile),
        ),
      );
    }
    await Promise.all(filesToWrite);
  }
  return result;
}

export const copy = async (from, to) => exec(`cp -r ${from} ${to}`);

export const replace = async (pathToReplace, search, replacement) => {
  const content = await fs.promises.readFile(pathToReplace, 'utf8');
  const updatedContent = content.replace(new RegExp(search, 'g'), replacement);
  await fs.promises.writeFile(pathToReplace, updatedContent, 'utf8');
};

// Remove a file from disk. If the file doesn't exist, ignore the error.
const unlink = (pathToUnlink) =>
  fs.promises
    .unlink(pathToUnlink)
    .catch((err) => (err.code === 'ENOENT' ? undefined : Promise.reject(err)));

const outputDirectory = process.env.CORD_BUILD_OUTPUT || 'dist';
export const outputPath = (...args) => path.resolve(outputDirectory, ...args);

function shellEscape(x) {
  return "'" + x.toString().replace(/'/g, "'\\''") + "'";
}
