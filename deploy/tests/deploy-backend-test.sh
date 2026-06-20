#!/usr/bin/env bash

set -u

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
SCRIPT="$ROOT_DIR/deploy/scripts/deploy-backend.sh"
FAKE_BIN="$ROOT_DIR/deploy/tests/fakes"

failures=0

assert_eq() {
  local expected=$1
  local actual=$2
  local message=$3

  if [[ "$actual" != "$expected" ]]; then
    printf 'not ok - %s (expected=%s actual=%s)\n' "$message" "$expected" "$actual"
    failures=$((failures + 1))
  fi
}

assert_contains() {
  local haystack=$1
  local needle=$2
  local message=$3

  if [[ "$haystack" != *"$needle"* ]]; then
    printf 'not ok - %s (missing=%s)\n' "$message" "$needle"
    failures=$((failures + 1))
  fi
}

assert_count() {
  local expected=$1
  local haystack=$2
  local needle=$3
  local message=$4
  local actual
  actual=$(grep -F -c "$needle" <<<"$haystack")

  assert_eq "$expected" "$actual" "$message"
}

test_rejects_invalid_commit_sha() {
  local output status

  output=$("$SCRIPT" not-a-sha 2>&1)
  status=$?

  assert_eq 2 "$status" "invalid SHA exits with usage error"
  assert_contains "$output" "40-character lowercase commit SHA" "invalid SHA explains accepted format"
}

test_deploys_migrates_and_records_healthy_image() {
  local temp_dir output status sha state
  temp_dir=$(mktemp -d)
  sha=0123456789abcdef0123456789abcdef01234567
  touch "$temp_dir/backend.env" "$temp_dir/commands.log"

  output=$(env \
    PATH="$FAKE_BIN:$PATH" \
    DEPLOY_ENV_FILE="$temp_dir/backend.env" \
    DEPLOY_STATE_DIR="$temp_dir/state" \
    FAKE_COMMAND_LOG="$temp_dir/commands.log" \
    FAKE_CURRENT_IMAGE_EXISTS=0 \
    FAKE_MIGRATION_STATUS=0 \
    FAKE_HEALTH_STATUS=0 \
    "$SCRIPT" "$sha" 2>&1)
  status=$?
  state=$(cat "$temp_dir/state/backend-current-sha" 2>/dev/null || true)

  assert_eq 0 "$status" "healthy deployment succeeds"
  assert_contains "$(cat "$temp_dir/commands.log")" "podman pull ghcr.io/kou050223/baka-and-test-summon-the-beasts-backend:$sha" "deployment pulls immutable image"
  assert_contains "$(cat "$temp_dir/commands.log")" "./bin/rails db:migrate" "deployment runs migration"
  assert_contains "$(cat "$temp_dir/commands.log")" "podman tag ghcr.io/kou050223/baka-and-test-summon-the-beasts-backend:$sha localhost/baka-backend:current" "deployment switches current image"
  assert_contains "$(cat "$temp_dir/commands.log")" "systemctl --user restart baka-backend.service" "deployment restarts Quadlet service"
  assert_eq "$sha" "$state" "healthy deployment records current SHA"

  rm -rf "$temp_dir"
}

test_rolls_back_when_new_image_is_unhealthy() {
  local temp_dir output status new_sha old_sha state commands
  temp_dir=$(mktemp -d)
  new_sha=0123456789abcdef0123456789abcdef01234567
  old_sha=89abcdef0123456789abcdef0123456789abcdef
  mkdir -p "$temp_dir/state"
  touch "$temp_dir/backend.env" "$temp_dir/commands.log"
  printf '%s\n' "$old_sha" >"$temp_dir/state/backend-current-sha"

  output=$(env \
    PATH="$FAKE_BIN:$PATH" \
    DEPLOY_ENV_FILE="$temp_dir/backend.env" \
    DEPLOY_STATE_DIR="$temp_dir/state" \
    BACKEND_HEALTH_ATTEMPTS=1 \
    FAKE_COMMAND_LOG="$temp_dir/commands.log" \
    FAKE_CURRENT_IMAGE_EXISTS=0 \
    FAKE_MIGRATION_STATUS=0 \
    FAKE_HEALTH_SEQUENCE=1,0 \
    FAKE_HEALTH_COUNTER="$temp_dir/health-counter" \
    "$SCRIPT" "$new_sha" 2>&1)
  status=$?
  state=$(cat "$temp_dir/state/backend-current-sha")
  commands=$(cat "$temp_dir/commands.log")

  assert_eq 1 "$status" "rolled back deployment reports failure"
  assert_contains "$commands" "podman tag localhost/baka-backend:previous localhost/baka-backend:current" "unhealthy deployment restores previous image"
  assert_count 2 "$commands" "systemctl --user restart baka-backend.service" "rollback restarts service a second time"
  assert_contains "$output" "rollback succeeded" "deployment reports successful rollback"
  assert_eq "$old_sha" "$state" "failed deployment preserves recorded SHA"

  rm -rf "$temp_dir"
}

test_rolls_back_when_service_restart_fails() {
  local temp_dir output status sha commands
  temp_dir=$(mktemp -d)
  sha=0123456789abcdef0123456789abcdef01234567
  touch "$temp_dir/backend.env" "$temp_dir/commands.log"

  output=$(env \
    PATH="$FAKE_BIN:$PATH" \
    DEPLOY_ENV_FILE="$temp_dir/backend.env" \
    DEPLOY_STATE_DIR="$temp_dir/state" \
    BACKEND_HEALTH_ATTEMPTS=1 \
    FAKE_COMMAND_LOG="$temp_dir/commands.log" \
    FAKE_CURRENT_IMAGE_EXISTS=0 \
    FAKE_MIGRATION_STATUS=0 \
    FAKE_HEALTH_STATUS=0 \
    FAKE_SYSTEMCTL_RESTART_SEQUENCE=1,0 \
    FAKE_SYSTEMCTL_COUNTER="$temp_dir/systemctl-counter" \
    "$SCRIPT" "$sha" 2>&1)
  status=$?
  commands=$(cat "$temp_dir/commands.log")

  assert_eq 1 "$status" "restart failure reports failed deployment"
  assert_contains "$commands" "podman tag localhost/baka-backend:previous localhost/baka-backend:current" "restart failure restores previous image"
  assert_count 2 "$commands" "systemctl --user restart baka-backend.service" "restart failure triggers rollback restart"
  assert_contains "$output" "rollback succeeded" "restart failure reports successful rollback"

  rm -rf "$temp_dir"
}

test_stops_unhealthy_first_deployment() {
  local temp_dir output status sha commands
  temp_dir=$(mktemp -d)
  sha=0123456789abcdef0123456789abcdef01234567
  touch "$temp_dir/backend.env" "$temp_dir/commands.log"

  output=$(env \
    PATH="$FAKE_BIN:$PATH" \
    DEPLOY_ENV_FILE="$temp_dir/backend.env" \
    DEPLOY_STATE_DIR="$temp_dir/state" \
    BACKEND_HEALTH_ATTEMPTS=1 \
    FAKE_COMMAND_LOG="$temp_dir/commands.log" \
    FAKE_CURRENT_IMAGE_EXISTS=1 \
    FAKE_MIGRATION_STATUS=0 \
    FAKE_HEALTH_STATUS=1 \
    "$SCRIPT" "$sha" 2>&1)
  status=$?
  commands=$(cat "$temp_dir/commands.log")

  assert_eq 1 "$status" "unhealthy first deployment fails"
  assert_contains "$commands" "systemctl --user stop baka-backend.service" "unhealthy first deployment stops service"
  assert_contains "$output" "no previous image is available" "first deployment explains missing rollback"

  rm -rf "$temp_dir"
}

test_rejects_invalid_commit_sha
test_deploys_migrates_and_records_healthy_image
test_rolls_back_when_new_image_is_unhealthy
test_rolls_back_when_service_restart_fails
test_stops_unhealthy_first_deployment

if ((failures > 0)); then
  printf '%d test assertion(s) failed\n' "$failures"
  exit 1
fi

printf 'all deploy-backend tests passed\n'
