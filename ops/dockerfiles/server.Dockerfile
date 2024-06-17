FROM node:18-alpine3.19

# The following step will likely be cached by docker build. It will only re-run
# if the base image has changed, or after we ran `docker system prune`, which
# removes immediate build steps.
RUN set -ex \
  && apk upgrade --no-cache \
  && apk add --no-cache \
  bash coreutils git python3 py3-pip curl postgresql16-client docker-cli zip py3-wheel aws-cli \
  && mkdir -p /radical /root/.aws \
  && echo -e '[default]\nregion=eu-west-2\noutput=json' >/root/.aws/config

COPY node_modules /radical/node_modules
COPY build /radical/build
# The servers are run from dist, i.e. the output of the build process
COPY dist /radical/dist
COPY config /radical/config
COPY database /radical/database
COPY scripts /radical/scripts
# The source folders are copied over so we can run the tests from within the Docker container
# You will need to add new top level directories here so the tests can still run properly on deployment
COPY common /radical/common
COPY external /radical/external
COPY server /radical/server
COPY sdk /radical/sdk
COPY opensource /radical/opensource
COPY docs /radical/docs
COPY jest /radical/jest
COPY \
  package.json \
  tsconfig.json \
  ops/dockerfiles/entrypoint.sh \
  ops/run-server.sh \
  .sequelizerc .sequelize-config.cjs \
  .prettierignore .prettierrc \
  /radical/

# Update all Alpine packages to their latest version to pick up security fixes.
# (This step comes after the COPY statements above to make sure this is not
# being cached by Docker.)
RUN apk upgrade --no-cache

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max_old_space_size=3072

WORKDIR /radical

ENTRYPOINT ["/radical/entrypoint.sh"]
CMD ["./run-server.sh"]
