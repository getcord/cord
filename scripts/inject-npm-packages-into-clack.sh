#!/bin/sh

set -ex

if [ $# -ne 1 ]
then
  echo "Usage: scripts/inject-npm-packages-into-clack.sh <clack directory>"
  exit 1
fi

cd "$(dirname "$0")"/../opensource/sdk-js
git clean -dfx
npm install
npm run build

MONOREPO_PACKAGES="$(/bin/pwd)/packages"

cd "$1/node_modules/@cord-sdk"
for package in */
do
  rm -r "$package/dist"
  cp -r "$MONOREPO_PACKAGES/$package/dist" "$package/"
done

cd "$MONOREPO_PACKAGES/.."
git clean -dfx
