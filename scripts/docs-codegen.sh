#!/bin/sh -e

# Run this script to produce the generated files used in the docs.  It takes no
# arguments, just run it.

cd "$(dirname $0)/.."

# Produce REST API schema files.
(
  cd opensource/sdk-js/packages/api-types
  npm ci
  node generate.mjs
)

# Produce apiData.ts.
(
  ./build/index.mjs --mode=development --clean --target=scripts/docs-extract-tsdoc.ts
  ./dist/scripts/docs-extract-tsdoc.js > docs/server/apiData/apiData.ts
)
