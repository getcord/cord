#!/usr/bin/env node

const fs = require('fs');

// This script is intended as a helper for extracting the list
// of open source software we rely on. It works by grabbing
// all the entries from our various package-lock.json files,
// finding all the dependencies, and building a CSV output
// of `NPM name,version`. Jackson wrote this in
// a hurry so the code is unapologetically not lovely. It
// expects to be run from the repo root.

const NODE_MODULES_STRING = 'node_modules/';
const NODE_MODULES_LENGTH = NODE_MODULES_STRING.length;

function makeDict(packageLockPath) {
  const packageLockStr = fs.readFileSync(packageLockPath).toString();
  const packageLock = JSON.parse(packageLockStr);
  const packages = packageLock.packages;
  const keys = Object.keys(packages);
  const dict = {};
  keys.forEach((key) => {
    if (key === '') {
      // Skip our top level cord package as we just want dependencies
      return;
    }
    if (packages[key].dev) {
      // Skip dev only dependencies
      return;
    }
    // Looking in `packages`, the names might include 'node_modules', this removes that
    // to make it easier to see what the actual packages are
    const nodeIndex = key.lastIndexOf(NODE_MODULES_STRING);
    let packageName = key;
    if (nodeIndex >= 0) {
      packageName = key.substring(nodeIndex + NODE_MODULES_LENGTH);
    }
    dict[packageName] = packages[key].version + ',' + packages[key].license;
  });

  return dict;
}

// Generated set of package_lock.json by `find . -name package-lock.json` and excluding ones that
// reference node_modules
const dict = {
  ...makeDict('./cypress/package-lock.json'),
  ...makeDict('./ops/aws/package-lock.json'),
  ...makeDict('./package-lock.json'),
  ...makeDict('./opensource/sdk-js/package-lock.json'),
};

const keys = Object.keys(dict);
keys.sort();

console.log('package,version,license');
for (let i = 0; i < keys.length; i++) {
  console.log(keys[i] + ',' + dict[keys[i]]);
}
