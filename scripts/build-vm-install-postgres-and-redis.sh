#!/bin/sh -eu

# This script should only be run on our build VM, and it only needs to be run
# once. It installs a Postgres server and Redis server in Docker containers,
# identical to the ones we use for local development. This server can be used
# in CI builds to create temporary databases for tests.
# When the script is run repeatedly, it will wipe the existing
# cord-testing-postgres image and container and starts over from scratch.

# Stop and remove existing cord-testing-postgres container and image
docker stop cord-testing-postgres || true
docker rm cord-testing-postgres || true
docker rmi -f cord-testing-postgres || true

# Build the image
docker build -t cord-testing-postgres ops/dockerfiles/postgres.dev/

# Start the container. Because this is server is only used for temporary testing
# databases, there is no need to persist its data directory.
docker run --name=cord-testing-postgres \
    --restart unless-stopped --detach \
    --publish 5432:5432 \
    -e CORD_POSTGRES_USER=ChuckNorris \
    -e CORD_POSTGRES_DB=radical_db \
    -e POSTGRES_HOST= \
    -e POSTGRES_PORT=5432 \
    -e POSTGRES_DB= \
    -e POSTGRES_USER= \
    -e POSTGRES_PASSWORD=r4dicalAF \
    cord-testing-postgres

# Start a redis instance
docker run --name=cord-testing-redis \
  --restart unless-stopped --detach \
  --publish 6379:6379 \
  redis:alpine
