#!/bin/sh -eu

# Our database schema uses a Postgres extension (uuid-ossp). Regular database
# users (non-superuser) are not permitted to create extensions in databases, so
# we create a template database here which has the extension installed in it.
# Any database user who can create a new database can choose this template,
# thus create a database with our necessary extensions in it.

# This is the name of the template database
TEMPLATE=template_radical_db

# Create an empty database under the name of our template
createdb --echo "$TEMPLATE"

# Connect to that new database...
psql --echo-queries \
    --variable=template="$TEMPLATE" \
    --variable=userName="$CORD_POSTGRES_USER" \
    --variable=password="$POSTGRES_PASSWORD" \
    "$TEMPLATE" <<'EOF'
-- ...and create the extension in it.
CREATE EXTENSION "uuid-ossp";
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

-- Mark this database as a template database.
UPDATE pg_catalog.pg_database SET datistemplate='t' WHERE datname=:'template';

-- Create a regular database user. The name is that of the POSTGRES_USER
-- variable in your .env file (which is available as CORD_POSTGRES_USER in this
-- shell script)
CREATE USER :"userName" CREATEDB LOGIN PASSWORD :'password';
EOF

# As the POSTGRES_USER database user, create a new database from the template
# we just created. The name of this new database is the value of POSTGRES_DB in
# your .env file (available as CORD_POSTGRES_DB in this shell script)
PGUSER="$CORD_POSTGRES_USER" createdb --echo --template="$TEMPLATE" "$CORD_POSTGRES_DB"
# This is the going to be the development database. It is owned by
# $POSTGRES_USER (from your .env), named $POSTGRES_DB (from your .env),
# and has the necessary extension installed.
# You can now run `npm run migrate` to initialise the database schema (with no
# data), or use `scripts/bootstrap-database.sh` to initialise it with the
# current prod-schema and a useful subset of data from prod.
