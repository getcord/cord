#!/bin/bash -e

# This script just exits with an error. Read the comment here if you want to use
# it. It's dangerous, only use it if you understand what you're doing.
exit 1

# This script is for DISASTER RECOVERY ONLY! Use it when you need to completely
# replace the data in prod with a snapshot. Do not run this unless you want to
# FULLY WIPE PROD and then load all data from a snapshot database into prod.
#
# The DISASTER this script is supposed to fix is a catastrophic data loss in
# prod. The prod database itself would still exist, but data would have been
# deleted to a degree that justifies rebuilding the prod db from backups.

# Disaster recovery procedure:
#
# Go to the AWS console and look up our prod database Aurora cluster. You should
# find it here:
# https://eu-west-2.console.aws.amazon.com/rds/home?region=eu-west-2#database:id=database-prod;is-cluster=true
# 
# Select the cluster from the list (the main "database-prod" entry), click the
# "Actions" buton in the top right and choose "Restore to point in time".
#
# Sadly, "Restore to point in time" does not fix the prod database itself, but
# instead creates a new Aurora cluster from our backups. We do that first, and
# then we can use this script to copy over all data from the newly created
# snapshot db to prod.
#
# Next, choose what time you want to reconstruct from. This should be a point in
# time before the disaster, but as late as possible of course.
#
# Most of the further settings you don't need to change. You do have to provide
# a name for the new Aurora cluster (under "Settings" -> "DB instance
# identifier"). Something like "prod-restore-TODAYS-DATE" should work nicely.
#
# You shouldn't need to change any other settings. The default settings will put
# the new cluster into our VPC and into the same security group as the prod db
# itself, which means it will be reachable from zero.
#
# Click "Restore to point in time" and wait until the new db cluster has been
# created and is ready.
#
# You may have to set the credentials to log into the new db (not sure if they
# come with the snapshot). Select the newly created snapshot db instance, click
# "Modify", fill in the new master password (must be the same as the prod db -
# look up "database-prod-1" in Secretsmanager), and click continue at the bottom
# of the page. Confirm to have this change effective immediately.
#
# Log in to zero. There you can edit this script: remove the "exit 1" line at
# the top, obviously, and then edit the following line to provide the hostname
# of the new db's endpoint. It should look similar to the current contents of
# the line:

SNAPSHOT_DB_HOST=prod-restore-2022-09-15.cbnbkmsizeuh.eu-west-2.rds.amazonaws.com

# You can then run this script. At the time of writing this a test run took 7.5
# minutes.
#
# Once the script finishes, the prod db will contain the data from the backup as
# of the time selected.
#
# THE END.

export PGUSER=ChuckNorris
export PGDATABASE=radical_db
export PGPASSWORD="$(aws secretsmanager get-secret-value --secret-id database-prod-1 |jq -r '.SecretString'|jq -r '.password')"

echo -n "Starting dump from $SNAPSHOT_DB_HOST to database-prod at "
date

(
  export PGHOST="$SNAPSHOT_DB_HOST"

  cat <<"EOF"
CREATE OR REPLACE FUNCTION public.gen_random_uuid()
    RETURNS uuid AS 'SELECT uuid_generate_v4();' LANGUAGE SQL;
DROP SCHEMA IF EXISTS cord CASCADE;

TRUNCATE public."SequelizeMeta";
COPY public."SequelizeMeta" (name) FROM stdin;
EOF
psql -c 'COPY public."SequelizeMeta" (name) TO stdout;'
echo '\.'

pg_dump --no-owner --no-acl --schema=cord

) | (
  export PGHOST=database-prod.int.cord.com

  psql -1 --variable=ON_ERROR_STOP=1
)

echo 'Done.'
date
