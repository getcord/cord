#!/usr/bin/env node

/*

This script updates/tidies up the package.json files of the packages in the
packages folder.

The version from the main package.json file is copied into all the other
package.json files. Some fields are set to values defined in this script. The
remaining fields are preserved as they are.

*/

import { promises as fs } from 'fs';

import { glob } from 'glob';
import prettier from 'prettier';

async function main() {
  const mainPkg = JSON.parse(await fs.readFile('package.json'));
  const packageJsonFiles = await glob('packages/*/package.json', {
    posix: true,
  });

  for (const fn of packageJsonFiles) {
    const packageName = /^packages\/(.*)\/package\.json$/.exec(fn)[1];

    const content = await fs.readFile(fn, { encoding: 'utf-8' });
    const pkg = JSON.parse(content);

    // Overwrite the values of some fields, for consistency.
    pkg['name'] = `@cord-sdk/${packageName}`;
    pkg['version'] = mainPkg.version;
    pkg['homepage'] = 'https://docs.cord.com/';
    pkg['license'] = 'MIT';
    pkg['files'] = ['dist/', '!dist/cjs/**/*.d.ts', 'LICENSE', 'README.md'];
    pkg['main'] = 'dist/cjs/index.js';
    pkg['module'] = 'dist/mjs/index.js';
    pkg['types'] = 'dist/mjs/types/index.d.ts';
    pkg['repository'] = {
      type: 'git',
      url: 'https://github.com/getcord/sdk-js.git',
      directory: `packages/${packageName}`,
    };

    for (const field of [
      'dependencies',
      'peerDependencies',
      'devDependencies',
    ]) {
      pkg[field] = setCordSdkVersion(pkg[field], mainPkg.version);
    }
    // This is the order in which we want the fields to appear.
    const fields = uniq([
      'name',
      'description',
      'version',
      'homepage',
      'license',
      'files',
      'main',
      'module',
      'types',
      'repository',
      'scripts',
      'dependencies',
      'peerDependencies',
      'devDependencies',
      ...Object.keys(pkg).sort(),
    ]);

    const newJson = `{${fields
      .filter((key) => pkg[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${JSON.stringify(pkg[key])}`)
      .join(',')}}`;
    const newContent = await prettier.format(newJson, { filepath: fn });
    if (newContent !== content) {
      await fs.writeFile(fn, newContent);
    }
  }
}

const uniq = (array) => [...new Set(array)];

/**
 * Set the version of dependencies on `@cord-sdk/*` packages
 */
function setCordSdkVersion(deps, sdkVersion) {
  if (deps === undefined) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(deps).map(([packageName, version]) =>
      packageName.startsWith('@cord-sdk/')
        ? [packageName, sdkVersion]
        : [packageName, version],
    ),
  );
}

main().then(
  () => {
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
