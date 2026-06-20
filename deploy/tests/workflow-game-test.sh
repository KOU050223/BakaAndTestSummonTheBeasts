#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
WORKFLOW="$ROOT_DIR/.github/workflows/game-ci.yml"

assert_contains() {
  local expected=$1
  if ! grep -Fq -- "$expected" "$WORKFLOW"; then
    printf 'game workflow does not contain: %s\n' "$expected" >&2
    exit 1
  fi
}

assert_contains "- 'deploy/**'"
assert_contains 'platforms: linux/arm64'
assert_contains 'ghcr.io/kou050223/baka-and-test-summon-the-beasts-game:'
assert_contains 'VCS_REF=${{ github.sha }}'
assert_contains 'run: ./deploy/tests/run-tests.sh'
assert_contains 'runs-on: [self-hosted, Linux, ARM64, raspi-home, production]'
assert_contains "github.ref == 'refs/heads/main'"
assert_contains './deploy/scripts/deploy-game.sh "$GITHUB_SHA"'

if grep -Fq 'pull_request_target:' "$WORKFLOW"; then
  printf 'self-hosted deployment workflow must not use pull_request_target\n' >&2
  exit 1
fi

printf 'game deployment workflow test passed\n'
