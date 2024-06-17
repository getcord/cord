#!/usr/bin/env node

// This script looks at the root package-lock.json and the
// opensource/sdk-js/package-lock.json and finds packages that both depend on
// but where different versions are in use.  Having these not match can cause
// problems where running npm install in a package in opensource/sdk-js will
// break a running server in the root because it overwrites a dependency with an
// incompatible version, so it's nice not to have them.

const fs = require('fs').promises;
const process = require('process');

// Change working directory to this directory
process.chdir(__dirname);

async function main() {
  const opensource = JSON.parse(
    await fs.readFile('../opensource/sdk-js/package-lock.json'),
  );
  const root = JSON.parse(await fs.readFile('../package-lock.json'));

  // Find all the things the opensource code depends on that we have an explicit
  // dependency on in the root package
  const sharedDeps = Object.keys(opensource.dependencies).filter(
    (p) =>
      p in root.packages[''].dependencies ||
      p in root.packages[''].devDependencies,
  );
  for (const dep of sharedDeps) {
    // For each shared dep, if the actual version being depended on between the
    // two package-lock files doesn't match, report it
    const opensourceVersion = opensource.dependencies[dep].version;
    const rootVersion = root.dependencies[dep].version;
    if (
      opensourceVersion.startsWith('file:') ||
      rootVersion.startsWith('file:')
    ) {
      continue;
    }
    if (opensourceVersion !== rootVersion) {
      console.log(
        `${dep}: root ${rootVersion} vs. opensource/sdk-js ${opensourceVersion}`,
      );
    }
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(`${err}`);
    process.exit(1);
  },
);
