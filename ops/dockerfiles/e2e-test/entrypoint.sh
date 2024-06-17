#!/bin/sh -e

if test "$CORD_AWS_CREDS_ON_STDIN"
then
  mkdir -p /home/node/.aws
  cat >/home/node/.aws/credentials
fi

exec "$@"
