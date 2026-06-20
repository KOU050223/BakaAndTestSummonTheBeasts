#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
DOCKERFILE="$ROOT_DIR/backend/Dockerfile"
ENTRYPOINT="$ROOT_DIR/backend/bin/docker-entrypoint"
DOCKERIGNORE="$ROOT_DIR/backend/Dockerfile.dockerignore"

assert_contains() {
  local file=$1
  local expected=$2
  if ! grep -Fq "$expected" "$file"; then
    printf '%s does not contain: %s\n' "$file" "$expected" >&2
    exit 1
  fi
}

assert_contains "$DOCKERFILE" 'ARG VCS_REF'
assert_contains "$DOCKERFILE" 'org.opencontainers.image.revision=$VCS_REF'
assert_contains "$DOCKERFILE" 'EXPOSE 8000'
assert_contains "$DOCKERIGNORE" 'backend/.env*'
assert_contains "$DOCKERIGNORE" 'backend/config/master.key'
assert_contains "$DOCKERIGNORE" 'backend/log/*'
assert_contains "$DOCKERIGNORE" 'backend/storage/*'

if grep -Fq 'db:prepare' "$ENTRYPOINT"; then
  printf '%s must not run migrations implicitly\n' "$ENTRYPOINT" >&2
  exit 1
fi

if grep -Fq 'assets:precompile' "$DOCKERFILE"; then
  printf '%s must not precompile assets for the API-only application\n' "$DOCKERFILE" >&2
  exit 1
fi

if grep -Fq 'COPY backend/vendor' "$DOCKERFILE"; then
  printf '%s must not copy host-specific vendored gems\n' "$DOCKERFILE" >&2
  exit 1
fi

printf 'backend image configuration test passed\n'
