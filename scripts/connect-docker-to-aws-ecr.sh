#!/bin/bash -e

# Use this script to connect docker to the AWS Elastic Container
# Registry (ECR).

URI="https://009160069219.dkr.ecr.eu-west-1.amazonaws.com"
aws ecr get-login-password --region "eu-west-1" | \
    docker login -u AWS "$URI" --password-stdin
