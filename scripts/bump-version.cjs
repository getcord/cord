#!/usr/bin/env node

/*
 * Use this script to bump the version in package.json.
 * You can indicate the bump behavior with the --type argument (default is "minor")
 *
 * Example, starting from current version 1.1.2
 * scripts/bump-version.cjs major    => 2.0.0
 * scripts/bump-version.cjs minor    => 1.2.0
 * scripts/bump-version.cjs patch    => 1.1.3
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const bumpBehavior = {
  major: ([major]) => [major + 1, 0, 0],
  minor: ([major, minor]) => [major, minor + 1, 0],
  patch: ([major, minor, patch]) => [major, minor, patch + 1],
};

// NodeJS's process.argv array contains two items before the actual arguments
// passed to the script.
// Complain if we get more than one argument, default to 'minor' if we get none.
const type =
  process.argv.length > 3
    ? 'too many arguments'
    : process.argv.length === 3
    ? process.argv[2]
    : 'minor';
if (!['major', 'minor', 'patch'].includes(type)) {
  console.error(`usage: ${process.argv[1]} [major|minor|patch]`);
  process.exit(1);
}

const packageFilePath = path.join(__dirname, '../package.json');
const packageLockFilePath = path.join(__dirname, '../package-lock.json');

// load package.json from file
const packageJSON = JSON.parse(fs.readFileSync(packageFilePath, 'utf8'));
const packageLockJSON = JSON.parse(
  fs.readFileSync(packageLockFilePath, 'utf8'),
);

// parse the version from package.json
const currentVersion = packageJSON.version.split('.').map((x) => parseInt(x));

if (currentVersion.length !== 3) {
  console.error(
    `The current version in package.lock (${packageJSON.version}) is not in the x.y.z format`,
  );
  process.exit(1);
}

// bump the version number
const newVersion = bumpBehavior[type](currentVersion).join('.');

// update the version in the package object and write it to file
packageJSON.version = newVersion;
fs.writeFileSync(packageFilePath, JSON.stringify(packageJSON));

// update the version in the package-lock object and write it to file
packageLockJSON.version = newVersion;
packageLockJSON.packages[''].version = newVersion;
fs.writeFileSync(
  packageLockFilePath,
  JSON.stringify(packageLockJSON, null, '  ') + '\n', // package-lock.json has newline at EOF
  'utf8',
);

// run prettier on the package.json file to ensure no unwanted changes
exec(`npx prettier ${packageFilePath} --write`);
