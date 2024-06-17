FROM postgres:12-alpine

COPY setup-cord.sh /docker-entrypoint-initdb.d/

# Update all Alpine packages to their latest version to pick up security fixes.
RUN apk upgrade --no-cache
