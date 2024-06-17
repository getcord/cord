#!/bin/bash -e

# This script will run as the `node` user. It unpacks a tar.gz file containing a
# monorepo snaphost, then will do a full build and start a server. This script
# also makes sure the server will shut down after a maximum of seven days, so PR
# servers don't stay up indefinitely,

# The `::group::' and '::endgroup::' lines written to stdout are for structuring
# the output of this script when displayed in GitHub Actions.

cd /home/node

# This is where we are going to put the static files to be served on
# prXXX.dev.cord.com (the equivalent of app.cord.com)
mkdir -p /shared/app

# Unpack the tar file with the monorepo contents
mkdir -p monorepo
cd monorepo
tar xzf /shared/monorepo.tar.gz --strip-components=1
mkdir -p dist config

# Install JavaScript dependencies into node_modules/
echo '::group::npm ci'
npm ci
echo '::endgroup::'

# Generate the .env file for this server environment
echo '::group::Generate .env'
(
    set -x && node scripts/generate-dotenv.cjs \
        --tier=pullreq \
        --pr-number="$PR_NUMBER" \
        --commit-hash="$GIT_COMMIT_HASH" \
        --include-secrets
)
echo '::endgroup::'

# Install a symlink from dist/external to /shared/app, so that the static files
# end up in the folder that the host system (running Nginx) shares with this
# container
rm -Rf dist/external
ln -s /shared/app dist/external

# Build!
echo '::group::Build JavaScript bundles'
node build/index.mjs --mode=production
echo '::endgroup::'

# Build more!
echo '::group::Build demo-apps'
npm run build-demo-apps
echo '::endgroup::'

# Set up database
echo '::group::Migrate database if necessary'
npm run migrate
echo '::endgroup::'

# Before starting the server, set off a self-destruct for 7 days from now
( sleep 7d ; killall node ) &

# Start server
echo '::group::Start server'
coproc DOCS { node -r dotenv/config dist/docs/server/index.js; }
node -r dotenv/config dist/server/index.js
kill $DOCS_PID
