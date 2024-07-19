#!/bin/bash -eu

# ~~~ BUILD ON COMMIT ~~~
# This script is run by the GitHub workflow 'build-and-deploy-on-push' each
# time the master branch is updated.

. scripts/ci/common.sh

ECR_REGISTRY="869934154475.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPO="$ECR_REGISTRY/server"
export CORD_SERVER_DOCKER_IMAGE_NAME="$ECR_REPO":latest

clean_up_and_build "prod staging test"

announce_build_step "Connect to ECR (Build machine)"
./scripts/connect-docker-to-aws-ecr.sh

announce_build_step "docker push"
echo "Pushing Docker image $CORD_SERVER_DOCKER_IMAGE_NAME"
docker push "$CORD_SERVER_DOCKER_IMAGE_NAME"

announce_build_step "Retrieve AWS secrets"
node scripts/finalize-config.cjs --input config/prod --output config/prod-with-secrets

# The loadtest tier may not exist, which means the finalize-config script will
# most likely fail. Even if we do attempt to migrate the loadtest database - any
# failure should not abort the deploy and hence is caught.
node scripts/finalize-config.cjs \
    --fail-quietly \
    --input config/loadtest --output config/loadtest-with-secrets

announce_build_step "Apply any database migrations"
DOTENV_CONFIG_PATH=config/prod-with-secrets \
    dist/generic/scripts/ci/migrate-database.js

if test -f config/loadtest-with-secrets
then
    DOTENV_CONFIG_PATH=config/loadtest-with-secrets \
        dist/generic/scripts/ci/migrate-database.js || \
        echo "Skipping loadtest tier"
fi

# Upload sourcemaps to Sentry, but don't stop if that fails.
upload_sourcemaps || true

announce_build_step "Deploy to staging"

# If deploy.js returns an exit code of
# * 0 (success): just continue
# * 2: catch the error, set `skipped_staging_deploy` to true, continue
# * anything else: it's an error, the script will exit immediately
skipped_staging_deploy=""
docker run --rm=true \
    -v "$(realpath /var/run/docker.sock)":/var/run/docker.sock \
    -e CORD_TIER=staging \
    -e GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}" \
    -e GITHUB_RUN_ID="${GITHUB_RUN_ID:-}" \
    -e GITHUB_RUN_NUMBER="${GITHUB_RUN_NUMBER:-}" \
    -e GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-}" \
    "$CORD_SERVER_DOCKER_IMAGE_NAME" \
    dist/generic/scripts/ci/deploy.js \
        --unattended \
        --pullImage "$CORD_SERVER_DOCKER_IMAGE_NAME" \
        --pushOnSuccess "$ECR_REPO":staging || {
    test "$?" = 2 && skipped_staging_deploy=true
} || exit 1

if ! test "$skipped_staging_deploy"
then
    announce_build_step "Update git tag for staging"
    update_git_tag staging "$(git rev-parse HEAD)"
fi

announce_build_step "Deploy to loadtest"
if test -f config/loadtest-with-secrets
then

    # Also deploy to loadtest, but just ignore if it fails
    skipped_loadtest_deploy=""
    docker run --rm=true \
        -v "$(realpath /var/run/docker.sock)":/var/run/docker.sock \
        -e CORD_TIER=loadtest \
        -e GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}" \
        -e GITHUB_RUN_ID="${GITHUB_RUN_ID:-}" \
        -e GITHUB_RUN_NUMBER="${GITHUB_RUN_NUMBER:-}" \
        -e GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-}" \
        "$CORD_SERVER_DOCKER_IMAGE_NAME" \
        dist/generic/scripts/ci/deploy.js \
            --unattended \
            --pullImage "$CORD_SERVER_DOCKER_IMAGE_NAME" \
            --pushOnSuccess "$ECR_REPO":loadtest || {
        test "$?" = 2 || announce_build_step "Loadtest push failed, but continuing push regardless"
        skipped_loadtest_deploy=true
    } || exit 1

    if ! test "$skipped_loadtest_deploy"
    then
        announce_build_step "Update git tag for loadtest"
        update_git_tag loadtest "$(git rev-parse HEAD)"
    fi
else
    echo "Skipping loadtest deploy"
fi

announce_build_step "scripts/ci/build-on-commit.sh finished successfully"
