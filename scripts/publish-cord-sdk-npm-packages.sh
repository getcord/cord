#!/bin/bash -e

# This script is for releasing our cord-sdk packages to NPM.
#
# *Before* you run this script:
# - run `npm login` so you can publish to npm. Publishing npm packages requires
#   2FA, so make sure you have set that up with your npm accout. This script
#   will run `npm publish` multiple times, and that will ask you to input a 2FA
#   password.
# - bump the version number in `opensource/sdk-js/package.json`
# - consider rebasing to latest master
#
# Now you can run the script. It will rebuild the packages. If there are no
# errors, it will ask you to press ENTER before it actually publishes to npm.
#
# Ideally, press CTRL-C to abort here the first time around. There will be
# changes in your local monorepo (updated version numbers in various
# `package.json` and `package-lock.json` files). Please submit them for code
# review and continue when they have been accepted.
#
# Run the script again and this time do press ENTER. This will now publish the
# packages to npm.
#
# Don't forget to land the Pull Request with those version number updates!

# Go to the cord-sdk directory
cd "$(dirname "$0")"/../opensource/sdk-js

# Remove all non-checked in files from this directory, including old builds of
# the SDK etc.
git clean -fdx

# Update the `package.json` files of the individual packages. This will copy the
# version number from the `opensource/sdk-js/package.json` into all those
# files.
scripts/update-package-json-files.mjs

# Install dependencies (this will go into `opensource/sdk-js/node_modules`)
npm install

# Build our packages
npm run build

# Also run `npm install` on the monorepo top level, to update the version
# numbers of SDK packages in our `package-lock.json`
( cd ../.. && npm install )

# Okay we are done
echo
echo
echo "Packages have been rebuilt and are ready for publishing."
echo "Press ENTER to continue or CTRL-C to abort"
read i

# Publish them to npm
cd packages
for i in */
do
  (cd "$i" && npm publish)
done

# Upload Cord 4.0's versioned CSS to S3 to be publicly served.
( cd ../../.. && scripts/upload-CSS.mjs )

# Remove builds
git clean -fdx

echo
echo "Done!"
echo
echo "Remember to update the open source repo."
echo "See scripts/sync-opensource-repo.ts for instructions."
