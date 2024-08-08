#!/bin/sh -e

# cd into directory which contains this script
cd "$(dirname $0)"

# Copy the `setup-cord-database.sh` script from the `postgres.dev` directory.
# `docker build` can only access files in the current directory, so we have to
# copy it here.
cp ../postgres.dev/setup-cord.sh setup-cord-database.sh

# Produce a minimal database dump (all schema and a few select rows of data).
# This script connects to the database configured in `.env`
( cd ../../.. && dist/scripts/pr-server-bootstrap-database.js ) >dump.sql

# Build the image!
docker build \
    --build-arg GIT_COMMIT_HASH="$(git rev-parse HEAD)" \
    --tag=${DOCKER_TAG:-009160069219.dkr.ecr.eu-west-1.amazonaws.com/pr-server:latest} \
    .
