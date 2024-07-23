#!/bin/sh

image_tag="cord:latest"
echo "Creating image tagged as $image_tag"
docker build -t $image_tag -f preview.Dockerfile .
