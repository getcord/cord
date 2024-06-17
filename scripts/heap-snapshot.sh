#!/bin/bash

# This script triggers the taking of a heap snapshot on your local server.  You
# need to be running the server with heap snapshots enabled (by setting the
# environment variable HEAP_SNAPSHOTS to a nonempty value before running
# local-dev).

# Find the PID of the process that's listening to :8161
PID=$(lsof -Fp -i ':8161' | head -n 1 | cut -c '2-')
if [ -z "$PID" ]; then
  echo >&2 "Error: Couldn't find server PID"
  exit 1
fi

# Check that that process has USR2 in its command line somewhere, so we don't
# accidentally kill processes that aren't set up to take heap snapshots
ps -p "$PID" -o 'command=' | grep USR2 >/dev/null
if [ $? -ne 0 ]; then
  echo >&2 "Error: Server isn't running with heap snapshots enabled.  Run local-dev again with HEAP_SNAPSHOTS set."
  exit 1
fi

# Trigger the snapshot
kill -USR2 "$PID"
