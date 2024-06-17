FROM node:18-alpine

# Passing in the git hash of the checked out, mainly to avoid caching the
# following steps.
ARG GIT_COMMIT_HASH

# The NodeJS/Alpine Docker container comes with a user named `node` set up. The
# user-id is 1000. Some of the scripts assume that is the case, so let's start
# with an assertion to make sure it's still like that.
# Then set the timezone in the container to UTC, upgrade all Alpine package and
# install a few additional ones.
RUN test 1000 = "$(id -u node)" \
  && echo UTC >/etc/timezone \
  && apk upgrade --no-cache \
  && apk add bash coreutils grep postgresql16 postgresql16-contrib redis python3 make g++

# Set up PostgreSQL
COPY setup-cord-database.sh dump.sql /tmp/
RUN \
   mkdir -p /run/postgresql /var/lib/postgresql/data && \
   chown -R postgres:postgres /run/postgresql /var/lib/postgresql && \
   su postgres -c "initdb -D /var/lib/postgresql/data" && \
   echo "host all all 0.0.0.0/0 md5" >>/var/lib/postgresql/data/pg_hba.conf && \
   echo "listen_addresses='*'" >>/var/lib/postgresql/data/postgresql.conf && \
   chown -R postgres:postgres /var/lib/postgresql && \
   su postgres -c "pg_ctl start -D /var/lib/postgresql/data" && \
   su postgres -c "CORD_POSTGRES_USER=ChuckNorris \
   POSTGRES_PASSWORD=r4dicalAF \
   CORD_POSTGRES_DB=radical_db \
   bash /tmp/setup-cord-database.sh" && \
   PGUSER=ChuckNorris psql radical_db --variable=ON_ERROR_STOP=1 -f /tmp/dump.sql && \
   rm /tmp/setup-cord-database.sh /tmp/dump.sql && \
   su postgres -c "pg_ctl stop -D /var/lib/postgresql/data"

COPY run.sh /home/node
COPY init.sh /
