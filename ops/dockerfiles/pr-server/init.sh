#!/bin/bash -e

# This script runs as root. It spins up PostgreSQL and Redis and then runs
# another script as the `node` user.

# The `::group::' and '::endgroup::' lines written to stdout are for structuring
# the output of this script when displayed in GitHub Actions.

cd /

echo '::group::Start PostgreSQL server'
su postgres -c "pg_ctl start -D /var/lib/postgresql/data"
echo '::endgroup::'

echo '::group::Start Redis server'
redis-server --daemonize yes
echo '::endgroup::'

# Start the main script as the 'node' user. This script will output further
# '::group::'/'::endgroup::' markers.
cd /home/node
su - node -c \
    "env PR_NUMBER="$PR_NUMBER" GIT_COMMIT_HASH="$GIT_COMMIT_HASH" ./run.sh"
