#!/usr/bin/env node

// This script updates package.json's declarations to say that we want at least
// the version that we currently have in package-lock.json.  This is mostly
// useful to prevent the situation where we depend on version ^4.3.2 and
// actually use 4.7.6 because of package-lock.json, which can be misleading if
// you're only looking at package.json.

const fs = require('fs').promises;

async function main() {
  const packageJson = JSON.parse(await fs.readFile('package.json'));
  const packageLock = JSON.parse(await fs.readFile('package-lock.json'));

  updateDeps(packageJson.dependencies, packageLock.packages);
  updateDeps(packageJson.devDependencies, packageLock.packages);

  await fs.writeFile(
    'package.json',
    JSON.stringify(packageJson, null, 2) + '\n',
  );
}

function updateDeps(deps, installedPackages) {
  for (const dep in deps) {
    if (deps[dep][0] === '^') {
      const installed = installedPackages[`node_modules/${dep}`];
      if (installed) {
        deps[dep] = `^${installed.version}`;
      }
    }
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
