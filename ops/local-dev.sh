#!/bin/bash

set -e

cd "$(dirname $0)"/..

# Install everything
npm install

# Start service dependencies (as of 2023-03-09, Postgres, Redis, and localstack)

# Create the key file for localstack
cat localhost/localhost.key localhost/localhost.crt > localhost/localhost.packed
(
  # Ensure Postgres knows how to be configured
  . ./.env
  export POSTGRES_USER POSTGRES_DB POSTGRES_PORT POSTGRES_PASSWORD
  
  # Start up service dependencies
  cd ops
  docker-compose up -d

  echo "Waiting for dependencies to start..."
  while ! pg_isready -U "$POSTGRES_USER" -h localhost -p "$POSTGRES_PORT" -q ; do
    sleep 1
  done
)
# Done starting dependencies

# Migrate the DB
npm run migrate

# Make a clean build of our code and watch for changes.  This is split into two
# commands so we can wait for the first build to be complete before starting the
# servers, but we want to keep running the watch in the background.
./build/index.mjs --mode=development --clean
./build/index.mjs --mode=development --watch --skipInitialBuild &

# Run the servers
npm run start-external-dev &

if [ -z "${HEAP_SNAPSHOTS}" ]; then
  npx nodemon --config nodemon-server.json &
else
  npx nodemon --config nodemon-server-snapshots.json &
fi
npx nodemon --config nodemon-docs-server.json &
npm run tsc
