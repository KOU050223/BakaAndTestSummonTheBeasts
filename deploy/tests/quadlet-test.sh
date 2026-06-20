#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
QUADLET="$ROOT_DIR/deploy/quadlet/baka-backend.container"

assert_line() {
  local expected=$1
  if ! grep -Fqx "$expected" "$QUADLET"; then
    printf 'missing Quadlet setting: %s\n' "$expected" >&2
    exit 1
  fi
}

assert_line 'Image=localhost/baka-backend:current'
assert_line 'ContainerName=baka-backend'
assert_line 'PublishPort=127.0.0.1:8000:8000'
assert_line 'EnvironmentFile=%h/.config/baka/backend.env'
assert_line 'LogDriver=k8s-file'
assert_line 'LogOpt=max-size=10mb'
assert_line 'Restart=on-failure'
assert_line 'WantedBy=default.target'

printf 'Quadlet configuration test passed\n'
