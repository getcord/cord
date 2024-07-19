#!/bin/bash -e

# This script needs to be run on a machine that can connect to our EC2 instances
# and databases.

tier="$1"
shift || true
image="$1"
shift || true

if (test "$tier" != prod && test "$tier" != staging && test "$tier" != loadtest) || ! test "$image"
then
    echo "Usage: $0 <prod|staging|loadtest> <Docker Image>"
    exit 1
fi

# Pull the given image name
scripts/connect-docker-to-aws-ecr.sh
docker pull "$image"

# Extract git commit hash from Docker image's metadata
commit_hash="$(
    docker image inspect "$image" |
    jq -r '.[0].Config.Labels."com.cord.git-commit-hash"' || true
)"

cat <<EOF


You are going to deploy the image
    $image
built from git commit
    $commit_hash
    https://radical.phacility.com/rM$commit_hash
to the $tier tier.

If this sounds good to you and you want to continue with that, type in the
word 'yes' in all capital letters and press return:
EOF

read input
if test "$input" != YES
then
    echo "Aborting as requested..."
    exit
fi

docker run --rm=true \
    -v "$(realpath /var/run/docker.sock)":/var/run/docker.sock \
    -v ~/.aws/credentials:/root/.aws/credentials \
    -e CORD_TIER="$tier" \
    "$image" \
    dist/generic/scripts/ci/deploy.js \
        --force \
        --pullImage "$image" \
        --pushOnSuccess 869934154475.dkr.ecr.eu-west-2.amazonaws.com/server:"$tier"

commit_hash="$(
    docker image inspect "$image" |
    jq -r '.[0].Config.Labels."com.cord.git-commit-hash"' || true
)"
