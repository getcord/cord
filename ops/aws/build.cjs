#!/usr/bin/env node

const { promises: fs } = require('fs');
const esbuild = require('esbuild');
const { default: ImportGlobPlugin } = require('esbuild-plugin-import-glob');
const packageJSON = require('./package.json');

async function main() {
  const scriptFileNames = (await fs.readdir('scripts')).filter((fn) =>
    fn.endsWith('.ts'),
  );

  await Promise.all(
    scriptFileNames.map((fn) =>
      esbuild.build({
        bundle: true,
        format: 'cjs',
        target: 'node18',
        minify: false,
        entryPoints: [`scripts/${fn}`],
        outfile: `dist/scripts/${fn.substring(0, fn.length - 3)}.cjs`,
        platform: 'node',
      }),
    ),
  );

  await esbuild.build({
    bundle: true,
    format: 'esm',
    target: 'node18',
    minify: false,
    plugins: [ImportGlobPlugin()],
    entryPoints: ['index.ts'],
    outfile: 'dist/index.js',
    platform: 'node',
    external: [
      '@aws-cdk/*',
      ...Object.keys(packageJSON.dependencies),
      ...Object.keys(packageJSON.devDependencies),
    ],
    sourcemap: 'linked',
  });

  await esbuild.build({
    bundle: true,
    format: 'esm',
    target: 'node18',
    minify: false,
    entryPoints: ['diff.ts'],
    outfile: 'dist/diff.js',
    platform: 'node',
    external: [
      '@aws-cdk/*',
      ...Object.keys(packageJSON.dependencies),
      ...Object.keys(packageJSON.devDependencies),
    ],
    sourcemap: 'linked',
  });
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
