#! /bin/sh

cp localhost/localhost.key dist/server/
cp localhost/localhost.crt dist/server/

while true; do
  echo "Starting the process..."
  npm run start-external-dev &
  npm run start-server-prod &
  npm run start-asyncWorker-prod
  echo "Process has failed. Restarting in 5 seconds..."
  sleep 5
done