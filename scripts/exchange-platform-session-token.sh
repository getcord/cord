#!/bin/bash

curl \
  -X POST https://local.cord.com:8161/v1/session \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$1\"}"