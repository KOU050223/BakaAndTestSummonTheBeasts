#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
QUADLET="$ROOT_DIR/deploy/quadlet/baka-game.container"

assert_line() {
  local expected=$1
  if ! grep -Fqx "$expected" "$QUADLET"; then
    printf 'missing Quadlet setting: %s\n' "$expected" >&2
    exit 1
  fi
}

assert_line 'Image=localhost/baka-game:current'
assert_line 'ContainerName=baka-game'
assert_line 'Network=host'
assert_line 'EnvironmentFile=%h/.config/baka/game.env'
assert_line 'LogDriver=k8s-file'
assert_line 'LogOpt=max-size=10mb'
assert_line 'Restart=on-failure'
assert_line 'WantedBy=default.target'

printf 'game Quadlet configuration test passed\n'
