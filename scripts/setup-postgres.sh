#!/bin/bash -e

cat <<'EOF'


If you have installed PostgreSQL on your local machine, then this script needs
to run once to do some initial set-up action to your PostgrSQL server.  You do
not have to re-run this when you drop or create a database on your server. It
only needs to run once when you have installed PostgreSQL on your machine.

If you use `npm run start-postgres`, i.e. run PostgreSQL in our prepared Docker
environment, you do not need to run this script either.

What this script does is to create a "template database" with the PostgreSQL
extensions installed that we use. With this in place, a new database can be
created from scratch without PostgreSQL-superuser privileges.

This script, however, needs those superuser privileges to create the template
database. PostgreSQL's superuser is usually called "postgres". If you have a
standard install of PostgreSQL on your machine, it will be called "postgres".
(If for whatever reason you chose a different name, you can set the
POSTGRES_SUPERUSER environment variable when calling this script.)

This script reads the .env file to get the database connection details. If you
have PGHOST set to localhost (or 127.0.0.1 or ::1 or something similar), then
TCP will be used to connect to the PostgreSQL, and you will get prompted for
the password of the postgres user several times. If you don't know what the
password is, you can try the following: set POSTGRES_HOST in your .env file
to the empty string, and then invoke this script like this:
```
    # sudo -u postgres scripts/setup-postgres.sh
```
With the host not set, a socket connection will be made to the PostgreSQL server
and that usually allows a user to connect without password. If you run it as
the user "postgres" on your OS (hence the `sudo -u postgres`), then you'll be
the PostgreSQL superuser without having to type in the password.

EOF

. ./.env || true

export PGHOST="$POSTGRES_HOST"
export PGPORT="$POSTGRES_PORT"
export PGUSER="${POSTGRES_SUPERUSER:-postgres}"
unset PGPASSWORD
unset PGDATABASE

TEMPLATE=template_radical_db

# If the template database already exists, make it a non-template so we can
# drop it
psql --echo-queries --variable=template="$TEMPLATE" <<'EOF'
UPDATE pg_database SET datistemplate=FALSE WHERE datname=:'template';
EOF

# Drop the template database (if it exists), and then create it from fresh.
dropdb --if-exists --echo "$TEMPLATE"
createdb --echo "$TEMPLATE"

# Install the extensions and then promote the created database to a template.
psql --echo-queries --variable=template="$TEMPLATE" <<'EOF'

CREATE EXTENSION "uuid-ossp";
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

UPDATE pg_database SET datistemplate=TRUE WHERE datname=:'template';

EOF

