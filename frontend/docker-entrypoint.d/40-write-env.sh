#!/bin/sh
set -eu

: "${API_BASE_URL:=}"

envsubst '${API_BASE_URL}' \
  < /usr/share/nginx/html/env.template.js \
  > /usr/share/nginx/html/env.js
