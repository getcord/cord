#!/bin/bash

cd "$(dirname "$0")/.."

TOK=$(LOGLEVEL=info ./dist/scripts/generate-application-auth-token.js --app b6501bf5-46f7-4db7-9996-c42dd9f758b0)
OUTP=$(curl -s --oauth2-bearer "$TOK" "$@")

JQ=$(echo "$OUTP" | jq -C 2>/dev/null)
if [ $? -eq 0 ]
then
	echo "$JQ"
else
	echo "$OUTP"
fi

echo
