#!/bin/bash -e

# Use this script to connect docker to the AWS Elastic Container
# Registry (ECR).

URI="https://869934154475.dkr.ecr.eu-west-2.amazonaws.com"
aws ecr get-login-password --region "eu-west-2" | \
    docker login -u AWS "$URI" --password-stdin
