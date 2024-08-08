#!/usr/bin/env bash

awslocal s3 mb s3://radical-stack-fileuploads-wumx9efffh4z --region eu-west-1
awslocal s3api put-bucket-cors --bucket radical-stack-fileuploads-wumx9efffh4z --cors file:///etc/localstack/init/ready.d/local-s3-cors-config.json

awslocal s3 mb s3://cord-public-uploads --region eu-west-1
awslocal s3api put-bucket-cors --bucket cord-public-uploads --cors file:///etc/localstack/init/ready.d/local-s3-cors-config.json

awslocal s3 mb s3://custom-s3-bucket --region eu-west-1
awslocal s3api put-bucket-cors --bucket custom-s3-bucket --cors file:///etc/localstack/init/ready.d/local-s3-cors-config.json
