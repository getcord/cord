import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import replaceRE from 'rollup-plugin-re';

import { vanillaExtractPlugin } from '@vanilla-extract/rollup-plugin';
import { cordPure } from './rollup-plugin-cord-pure.js';

// Disable sourcemaps because we aren't including the source code in the NPM package,
// so the source maps refer to files that don't exist, which causes errors with create-react-app.
// The source maps aren't very useful without the source files anyway.
const INCLUDE_SOURCEMAP = false;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function packageBuildConfig(packageName, options = {}) {
  const dirname = path.resolve(__dirname, 'packages', packageName);

  const pkg = JSON.parse(
    await fs.promises.readFile(path.resolve(dirname, 'package.json'), {
      encoding: 'utf-8',
    }),
  );

  return [
    {
      input: path.resolve(dirname, 'index.ts'),
      external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...(options.extraExternal || []),
      ],
      plugins: [
        typescript({
          tsconfig: path.resolve(dirname, 'tsconfig.json'),
        }),
        cordPure([
          'createContext',
          'forwardRef',
          'memo',
          'React.createContext',
          'React.forwardRef',
          'React.memo',
          'Object.assign',
        ]),
        copy({
          targets: [
            {
              src: path.resolve(dirname, '..', '..', 'LICENSE'),
              dest: dirname,
            },
            ...(options.extraCopyTargets || []),
          ],
        }),
        declareBundleType(),
        replace({
          CORD_REACT_PACKAGE_VERSION: `"${pkg.version}"`,
          preventAssignment: true,
        }),
        vanillaExtractPlugin(),
        // The CSS is inserted by sdk.latest.js, no need for it here
        replaceRE({
          patterns: [
            {
              test: /import.*vanilla.*;/g,
              replace: '// Removed css;',
            },
          ],
        }),
      ],
      output: [
        {
          file: path.resolve(dirname, pkg.main),
          format: 'cjs',
          sourcemap: INCLUDE_SOURCEMAP,
          assetFileNames({ name }) {
            return name?.replace(/^packages\/react\//, '') ?? '';
          },
          inlineDynamicImports: true,
        },
        {
          file: path.resolve(dirname, pkg.module),
          format: 'es',
          sourcemap: INCLUDE_SOURCEMAP,
          assetFileNames({ name }) {
            return name?.replace(/^packages\/react\//, '') ?? '';
          },
          inlineDynamicImports: true,
        },
      ],
    },
  ];
}

function declareBundleType() {
  return {
    generateBundle(options, bundle) {
      const type = { cjs: 'commonjs', es: 'module' }[options.format];
      if (type) {
        bundle['package.json'] = {
          fileName: 'package.json',
          type: 'asset',
          source: JSON.stringify({ type }, undefined, 2) + '\n',
        };
      }
    },
  };
}

async function rollupConfig() {
  const configs = await Promise.all([
    packageBuildConfig('types'),
    packageBuildConfig('components'),
    packageBuildConfig('jsx'),
    packageBuildConfig('react', {
      extraExternal: [
        'fake-indexeddb/lib/FDBKeyRange.js',
        'dayjs/plugin/calendar.js',
        'jotai/react/utils',
        /dayjs\/locale\/.*[.]js/,
      ],
    }),
    packageBuildConfig('server', { extraExternal: ['crypto'] }),
    packageBuildConfig('api-types', {
      extraCopyTargets: [
        // Copy the generated schema.json into the dist folder
        {
          src: path.resolve(
            __dirname,
            'packages',
            'api-types',
            'generate',
            'schema.json',
          ),
          dest: path.resolve(__dirname, 'packages', 'api-types', 'dist'),
        },
      ],
    }),
    packageBuildConfig('chatbot-base'),
    packageBuildConfig('chatbot-anthropic'),
    packageBuildConfig('chatbot-openai'),
  ]);

  return configs.flat();
}

export default rollupConfig();
