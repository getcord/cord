#!/bin/bash

# https://github.com/FiloSottile/mkcert

# nss is needed for Firefox
which brew && brew install mkcert nss

mkcert -install

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
mkcert \
  -cert-file $SCRIPTPATH/../localhost/localhost.crt \
  -key-file $SCRIPTPATH/../localhost/localhost.key \
  local.cord.com '*.local.cord.com' localhost 127.0.0.1 ::1 0.0.0.0
