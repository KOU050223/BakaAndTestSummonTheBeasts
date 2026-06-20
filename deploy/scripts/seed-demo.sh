#!/usr/bin/env bash

set -euo pipefail

deploy_env_file=${DEPLOY_ENV_FILE:-$HOME/.config/baka/backend.env}

if [[ ! -r "$deploy_env_file" ]]; then
  printf 'error: deployment environment file is not readable: %s\n' "$deploy_env_file" >&2
  exit 2
fi

podman run --rm --network=host \
  --env-file "$deploy_env_file" \
  localhost/baka-backend:current \
  ./bin/rails db:seed:demo
