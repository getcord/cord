#!/bin/bash -e

PR_NUMBER="$1"
REF="$2"
CONTAINER_NAME="pr-$PR_NUMBER"

if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]
then
  echo "PR_NUMBER must be a number"
  exit 1
fi

if ! [[ "$REF" =~ ^[0-9a-fA-F]+$ ]]
then
  echo "REF must be a commit hash"
  exit 1
fi

# Stop existing container, if there is one
echo '::group::Stop any existing container for this PR'
( docker stop "$CONTAINER_NAME" && sleep 5 ) || true
docker rm --force "$CONTAINER_NAME" || true
echo '::endgroup::'

rm -Rf /srv/pr/"$PR_NUMBER"
mkdir -p /srv/pr/"$PR_NUMBER"

# Download git archive
echo '::group::Download Git archive'
SECRET_ID=github-ops-user
ORGANIZATION=getcord
REPO=monorepo

ACCESS_TOKEN="$(
    aws secretsmanager get-secret-value --secret-id "$SECRET_ID" | \
    jq -r '.SecretString | fromjson | .accessToken'
)"

curl -L >/srv/pr/"$PR_NUMBER"/monorepo.tar.gz \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    https://github.com/"$ORGANIZATION"/"$REPO"/archive/"$REF".tar.gz

chown -R ec2-user:ec2-user /srv/pr/"$PR_NUMBER"
echo '::endgroup::'

# Launch Docker container
echo '::group::Launch Docker container'
docker run --detach --pull=always --rm=true --tty=true \
    --name="$CONTAINER_NAME" \
    -e PR_NUMBER="$PR_NUMBER" \
    -e GIT_COMMIT_HASH="${REF:0:10}" \
    -v /srv/pr/"$PR_NUMBER"/:/shared \
    869934154475.dkr.ecr.eu-west-2.amazonaws.com/pr-server:latest /init.sh
echo '::endgroup::'

# Tail the logs of the docker container until we encounter the string 'Server
# initialization complete'. The logs contain those '::group::'/'::endgroup::'
# markers for GitHub so we don't add one here.
coproc LOGS { docker logs --follow "$CONTAINER_NAME" 2>&1; }
sed --unbuffered '/Server initialization complete/q' <&${LOGS[0]}
kill $LOGS_PID
