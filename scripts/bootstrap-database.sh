#!/bin/bash -eu

# Pass the authorization token to this script to have your local database
# reset completely (wiped!) and populated with data from our prod database.

AUTH_TOKEN="$*"

if ! test "$AUTH_TOKEN"
then
  cd "$(dirname $0)"/..
  ./build/index.mjs --mode=development --clean --target=scripts/admin-auth-token.ts > /dev/null
  AUTH_TOKEN=$(./dist/scripts/admin-auth-token.js --withBearer --tier=staging)

  if ! test "$AUTH_TOKEN"
  then
    exec >&2
    echo "You must pass your authorization token to this script."
    echo "Go to Hacks panel (in production-Cord) and copy-and-paste the"
    echo "full contents of the 'Authorization Header' field."
    echo
    echo "Should look something like this:"
    echo "# scripts/bootstrap-database.sh Bearer abcdef..very_long_string..xyz"
    exit 1
  fi
fi

source .env

# We want to make sure nobody accidentally connects to the production database
# and runs this script.
# If POSTGRES_HOST not set, or set to "localhost" or begins with "/" (thus
# pointing to a unix domain socket path rather than a host name for tcp
# connection), we should be safe. In any other case, ask the user to confirm.
#
# One last warning: if you use ssh tunnels to connect to the production
# database, then you would set POSTGRES_HOST to localhost. This script can't
# warn you then. Anyone who uses ssh tunnels to connect to prod db sometimes
# must be extra careful!
if test "$POSTGRES_HOST" && 
  test "$POSTGRES_HOST" != "localhost" &&
  test "$POSTGRES_HOST" != "127.0.0.1" &&
  test "${POSTGRES_HOST:0:1}" != "/"
then
  echo >&2 "Your POSTGRES_HOST is set to $POSTGRES_HOST"
  echo >&2 "It doesn't look like you are connecting to a local database."
  echo >&2 "Please make absolutely sure you never run this script connecting"
  echo >&2 "to the prod database."
  echo >&2
  echo >&2 "If you know what you are doing here, enter CONTINUE (in all caps)"
  echo >&2 "to continue, or anything else (or CTRL-C) to stop here."
  read prompt <&2
  test "$prompt" = "CONTINUE" || exit
fi

curl \
  --compressed \
  --header "Authorization: $AUTH_TOKEN" \
  https://admin.staging.cord.com/partial-database-dump | \
  PGPASSWORD="$POSTGRES_PASSWORD" \
  PGHOST="$POSTGRES_HOST" \
  PGPORT="$POSTGRES_PORT" \
  PGUSER="$POSTGRES_USER" \
  PGDATABASE="$POSTGRES_DB" \
  psql --variable=ON_ERROR_STOP=1
