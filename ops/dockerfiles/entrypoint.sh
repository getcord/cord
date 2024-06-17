#!/bin/sh

if test "$CORD_AWS_CREDS_ON_STDIN"
then
  mkdir -p ~/.aws
  cat >~/.aws/credentials
fi

if test "$CORD_TIER" && test -f "/radical/config/$CORD_TIER"
then
  rm -f /radical/.env
  node /radical/scripts/finalize-config.cjs \
    --input "/radical/config/$CORD_TIER" \
    --output /radical/.env
fi

if ! test -f /radical/.env
then
  echo >&2 \
    "The CORD_TIER environment variable must be set to the name of an existing config:"
  ls /radical/config >&2
  exit 1
fi

exec "$@"
