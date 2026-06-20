#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
FAKE_BIN="$ROOT_DIR/deploy/tests/fakes"
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT

touch "$temp_dir/backend.env" "$temp_dir/commands.log"

env \
  PATH="$FAKE_BIN:$PATH" \
  DEPLOY_ENV_FILE="$temp_dir/backend.env" \
  FAKE_COMMAND_LOG="$temp_dir/commands.log" \
  task --dir "$ROOT_DIR" deploy:seed:demo >/dev/null

expected="podman run --rm --network=host --env-file $temp_dir/backend.env localhost/baka-backend:current ./bin/rails db:seed:demo"
actual=$(cat "$temp_dir/commands.log")

if [[ "$actual" != "$expected" ]]; then
  printf 'deploy:seed:demo command mismatch\nexpected: %s\nactual:   %s\n' "$expected" "$actual" >&2
  exit 1
fi

printf 'Taskfile demo seed task test passed\n'
