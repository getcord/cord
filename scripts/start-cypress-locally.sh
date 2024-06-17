#!/bin/bash -eu

cd cypress
npm ci
cd ../

source .env

# Connect to local db and get signing secret for automated tests application
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGHOST="$POSTGRES_HOST"
export PGPORT="$POSTGRES_PORT"
export PGUSER="$POSTGRES_USER"
export PGDATABASE="$POSTGRES_DB"
export TEST_APP_SECRET="$(psql -Atc "SELECT \"sharedSecret\" FROM cord.applications WHERE applications.id = 'dfa86152-9e7e-4d2d-acd6-bfddef71f58e';")"

# Opens Cypress UI so you can select and see the tests you want to run
# NB you will also need to have your server and db running locally
cd cypress
npx cypress open
