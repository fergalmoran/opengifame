#!/usr/bin/env bash

docker run --rm -it \
  -p 3000:3000 \
  -e DATABASE_URL="postgres://postgres:hackme@localhost:5432/opengifame" \
  -v "$(pwd)":/app/public/uploads \
  ghcr.io/fergalmoran/opengifame:latest