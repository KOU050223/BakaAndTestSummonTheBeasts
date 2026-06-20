#!/usr/bin/env bash

set -u

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCRIPT="$ROOT_DIR/deploy/scripts/install-backend.sh"
FAKE_BIN="$ROOT_DIR/deploy/tests/fakes"
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT
touch "$temp_dir/commands.log"

output=$(env HOME="$temp_dir/home" PATH="$FAKE_BIN:$PATH" FAKE_COMMAND_LOG="$temp_dir/commands.log" "$SCRIPT" 2>&1)
status=$?

if [[ "$status" != 2 ]]; then
  printf 'expected first install to exit 2, got %s\n' "$status" >&2
  exit 1
fi

if [[ ! -f "$temp_dir/home/.config/baka/backend.env" ]]; then
  printf 'backend.env was not created\n' >&2
  exit 1
fi

if [[ "$(stat -f '%Lp' "$temp_dir/home/.config/baka/backend.env" 2>/dev/null || stat -c '%a' "$temp_dir/home/.config/baka/backend.env")" != 600 ]]; then
  printf 'backend.env does not have mode 600\n' >&2
  exit 1
fi

if [[ ! -f "$temp_dir/home/.config/containers/systemd/baka-backend.container" ]]; then
  printf 'Quadlet was not installed\n' >&2
  exit 1
fi

if [[ "$output" != *'fill in backend.env before deployment'* ]]; then
  printf 'first install did not explain required configuration\n' >&2
  exit 1
fi

output=$(env HOME="$temp_dir/home" PATH="$FAKE_BIN:$PATH" FAKE_COMMAND_LOG="$temp_dir/commands.log" "$SCRIPT" 2>&1)
status=$?

if [[ "$status" != 2 || "$output" != *'replace placeholder values'* ]]; then
  printf 'install accepted an environment file with placeholder values\n' >&2
  exit 1
fi

printf 'install-backend test passed\n'
