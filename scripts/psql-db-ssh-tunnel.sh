#!/bin/sh

npm run db-ssh-tunnel
PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id database-prod-1 | jq -r '.SecretString | fromjson | .password') \
PGOPTIONS="--search_path=cord,public" \
psql \
  --host localhost \
  --port 15432 \
  --user ChuckNorris \
  radical_db
