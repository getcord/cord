#!/bin/bash

set -e

ACCESS_KEY_METADATA="$(aws iam list-access-keys | jq .AccessKeyMetadata)"

if ! echo "${ACCESS_KEY_METADATA}" | jq -e 'length == 1' >/dev/null ; then
  echo "Must have exactly 1 access key, currently $(echo ${ACCESS_KEY_METADATA} | jq length)"
  exit 1
fi

CURRENT_ACCESS_KEY="$(echo "${ACCESS_KEY_METADATA}" | jq -r '.[0].AccessKeyId')"
NEW_ACCESS_KEY="$(aws iam create-access-key | jq .AccessKey)"

# It's important to delete the old access key before we install the new one,
# because the new key takes a while before it's accepted for IAM operations, so
# deleting using the new key tends to fail
aws iam delete-access-key --access-key-id "${CURRENT_ACCESS_KEY}"

aws configure set aws_access_key_id "$(echo "${NEW_ACCESS_KEY}" | jq -r .AccessKeyId)"
aws configure set aws_secret_access_key "$(echo "${NEW_ACCESS_KEY}" | jq -r .SecretAccessKey)"

ssh zero "mkdir -p .aws" >/dev/null
scp -p ~/.aws/credentials zero:.aws/credentials >/dev/null

echo "Access key $(echo "${NEW_ACCESS_KEY}" | jq -r .AccessKeyId) installed, key ${CURRENT_ACCESS_KEY} deleted"
