#!/bin/bash -eu

# ~~~ BUILD AND DEPLOY A HOTFIX ~~~
# This script is run by GitHub when invoked manually to build and deploy a hotfix.

. scripts/ci/common.sh

tier="$*"

if test "$tier" != prod && test "$tier" != staging
then
    echo >&2 "This script must be given a single argument of either 'prod' or 'staging'"
    exit 1
fi

# Retrieve the current prod/staging git tag
git fetch --depth 1 origin refs/tags/"$tier"

# Check that this commit's parent is the current prod/staging commit
if test "$(git rev-parse HEAD^)" != "$(git rev-parse FETCH_HEAD)"
then
    echo >&2 "Hotfix error: the parent of this commit is not the current version of $tier"
    exit 1
fi

# Build
ECR_REGISTRY="009160069219.dkr.ecr.eu-west-1.amazonaws.com"
ECR_REPO="$ECR_REGISTRY/server"
export CORD_SERVER_DOCKER_IMAGE_NAME="$ECR_REPO":hotfix-"$tier"-"$GITHUB_RUN_ID"

ACCELERATE_DEPLOY="${ACCELERATE_DEPLOY:-false}"

if [ "$ACCELERATE_DEPLOY" == "true" ]
then 
    ( clean_up_and_build "$tier" )
else
    ( clean_up_and_build "$tier test" )
fi

announce_build_step "Connect to ECR (Build machine)"
./scripts/connect-docker-to-aws-ecr.sh

announce_build_step "docker push"
echo "Pushing Docker image $CORD_SERVER_DOCKER_IMAGE_NAME"
docker push "$CORD_SERVER_DOCKER_IMAGE_NAME"

announce_build_step "Retrieve AWS secrets"
node scripts/finalize-config.cjs --input config/"$tier" --output config/"$tier"

upload_sourcemaps

announce_build_step "Deploy to $tier"

docker run --rm=true \
    -v "$(realpath /var/run/docker.sock)":/var/run/docker.sock \
    -e CORD_TIER="$tier" \
    -e GITHUB_REPOSITORY="$GITHUB_REPOSITORY" \
    -e GITHUB_RUN_ID="$GITHUB_RUN_ID" \
    -e GITHUB_RUN_NUMBER="$GITHUB_RUN_NUMBER" \
    -e GITHUB_SERVER_URL="$GITHUB_SERVER_URL" \
    "$CORD_SERVER_DOCKER_IMAGE_NAME" \
    dist/generic/scripts/ci/deploy.js \
        --unattended \
        --force \
        --pullImage "$CORD_SERVER_DOCKER_IMAGE_NAME" \
        --pushOnSuccess "$ECR_REPO":"$tier"

announce_build_step "Update git tag for $tier"
package_version="$(jq -r .version <package.json 2>/dev/null || true)"
update_git_tag "$tier" "$(git rev-parse HEAD)" "$package_version"

announce_build_step "scripts/ci/build-and-deploy-hotfix.sh finished successfully"
