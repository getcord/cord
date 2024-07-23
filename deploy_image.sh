#! /bin/sh

docker stop cord
docker rm cord
docker create -p 8161:8161 -p 8179:8179 --name cord cord:latest
docker start cord