#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCRIPT="$ROOT_DIR/deploy/scripts/seed-demo.sh"
FAKE_BIN="$ROOT_DIR/deploy/tests/fakes"
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT

touch "$temp_dir/backend.env" "$temp_dir/commands.log"

env \
  PATH="$FAKE_BIN:$PATH" \
  DEPLOY_ENV_FILE="$temp_dir/backend.env" \
  FAKE_COMMAND_LOG="$temp_dir/commands.log" \
  "$SCRIPT" >/dev/null

expected="podman run --rm --network=host --env-file $temp_dir/backend.env localhost/baka-backend:current ./bin/rails db:seed:demo"
actual=$(cat "$temp_dir/commands.log")

if [[ "$actual" != "$expected" ]]; then
  printf 'seed-demo command mismatch\nexpected: %s\nactual:   %s\n' "$expected" "$actual" >&2
  exit 1
fi

if ! grep -Fq 'cmd: ./deploy/scripts/seed-demo.sh' "$ROOT_DIR/Taskfile.yml"; then
  printf 'deploy:seed:demo must delegate to deploy/scripts/seed-demo.sh\n' >&2
  exit 1
fi

printf 'demo seed deployment test passed\n'
