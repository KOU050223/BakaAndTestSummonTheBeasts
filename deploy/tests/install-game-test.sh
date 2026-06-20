#!/usr/bin/env bash

set -u

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCRIPT="$ROOT_DIR/deploy/scripts/install-game.sh"
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

if [[ ! -f "$temp_dir/home/.config/baka/game.env" ]]; then
  printf 'game.env was not created\n' >&2
  exit 1
fi

if [[ "$(stat -c '%a' "$temp_dir/home/.config/baka/game.env" 2>/dev/null || stat -f '%Lp' "$temp_dir/home/.config/baka/game.env")" != 600 ]]; then
  printf 'game.env does not have mode 600\n' >&2
  exit 1
fi

if [[ ! -f "$temp_dir/home/.config/containers/systemd/baka-game.container" ]]; then
  printf 'Quadlet was not installed\n' >&2
  exit 1
fi

if [[ "$output" != *'fill in game.env before deployment'* ]]; then
  printf 'first install did not explain required configuration\n' >&2
  exit 1
fi

output=$(env HOME="$temp_dir/home" PATH="$FAKE_BIN:$PATH" FAKE_COMMAND_LOG="$temp_dir/commands.log" "$SCRIPT" 2>&1)
status=$?

if [[ "$status" != 2 || "$output" != *'replace placeholder values'* ]]; then
  printf 'install accepted an environment file with placeholder values\n' >&2
  exit 1
fi

printf 'install-game test passed\n'
