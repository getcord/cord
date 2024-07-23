#!/bin/bash -e

# ~~~ DAILY PROD PUSH ~~~
# This script is run by a cronjob on workdays in the morning. This is for the
# automatic daily prod push only, please use "scripts/manual-deploy.sh" for
# manual deploys.
# This script (or rather the deploy.js script it invokes below) will detect if
# the `automaticDeploy` setting for prod is off, and if so, skip the deployment.

ECR_REGISTRY="869934154475.dkr.ecr.eu-west-2.amazonaws.com"
ECR_REPO="$ECR_REGISTRY/server"
STAGING_IMAGE="$ECR_REPO:staging"

. scripts/ci/common.sh

# Log in to out ECR repository
./scripts/connect-docker-to-aws-ecr.sh

# Pull the staging image
docker pull "$STAGING_IMAGE"

# Run the deploy script from within the staging image. If the deployment fails,
# but also if it is skipped because of `automaticDeploy` set to false, this
# command will return a non-zero exit code, which means this whole script will
# be terminated immediately.

# If there is a ~/.aws/credentials file, then mount it into the container.
docker_opts=()
test -f ~/.aws/credentials && docker_opts+=(-v ~/.aws/credentials:/root/.aws/credentials)

docker run --rm=true \
    -v "$(realpath /var/run/docker.sock)":/var/run/docker.sock \
    "${docker_opts[@]}" \
    -e CORD_TIER=prod \
    -e GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}" \
    -e GITHUB_RUN_ID="${GITHUB_RUN_ID:-}" \
    -e GITHUB_RUN_NUMBER="${GITHUB_RUN_NUMBER:-}" \
    -e GITHUB_SERVER_URL="${GITHUB_SERVER_URL:-}" \
    "$STAGING_IMAGE" \
    dist/generic/scripts/ci/deploy.js \
        --unattended \
        --pullImage "$STAGING_IMAGE" \
        --pushOnSuccess "$ECR_REPO:prod"

# If the command above has failed, bash will stop here (because of the `-e`
# option we passed to bash, see line 1).
# Thus we only continue after a successful deployment.
# The following steps are therefore *not* run if the deployment was skipped
# because of automatic deploys being disabled.

# Update 'prod' tag in Git
prod_commit="$(
    docker image inspect 869934154475.dkr.ecr.eu-west-2.amazonaws.com/server:prod |
    jq -r '.[0].Config.Labels."com.cord.git-commit-hash"' || true
)"
package_version="$(
    docker image inspect 869934154475.dkr.ecr.eu-west-2.amazonaws.com/server:prod |
    jq -r '.[0].Config.Labels."com.cord.version"' || true
)"
if test "$prod_commit"
then
    git fetch --depth 1 origin "$prod_commit"
    update_git_tag prod "$prod_commit" "$package_version"
fi

# Activate automatic deploys in staging again
echo "UPDATE cord.heimdall SET value=TRUE WHERE tier='staging' AND key='automaticDeploy';" | \
    docker run --rm=true -i \
        -e CORD_TIER=staging \
        "$STAGING_IMAGE" \
        ./scripts/psql-from-env.sh

# Bump version (this will also trigger a staging deploy)

# Step 1: run bump-version script
node ./scripts/bump-version.cjs

# Step 2: commit change, rebase on current master once again (in case commit
# landed just now) and push
git config user.name "Cord Ops"
git config user.email "ops@cord.com"
git add .
git commit --no-verify -m "Bump version"
# This used to be git pull --rebase --depth 1 origin master, but that failed in
# the case where exactly one commit landed during the push for
# not-entirely-clear git reasons
git fetch --depth 1 origin master
git rebase HEAD^ --onto FETCH_HEAD

git push --no-verify origin HEAD:master
