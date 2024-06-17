#!/bin/bash

set -e

coproc DOCS { npm run start-docs-server-prod; }

npm run start-server-prod

kill $DOCS_PID
