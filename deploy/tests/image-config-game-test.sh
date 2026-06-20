#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
DOCKERFILE="$ROOT_DIR/game/Dockerfile"
DOCKERIGNORE="$ROOT_DIR/game/Dockerfile.dockerignore"

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
assert_contains "$DOCKERFILE" 'EXPOSE 8080'
assert_contains "$DOCKERFILE" 'CGO_ENABLED=0'
assert_contains "$DOCKERIGNORE" 'game/.env*'

# シークレットを含む .env をイメージに焼き込んでいないこと
if grep -Eq '^COPY[[:space:]].*\.env' "$DOCKERFILE"; then
  printf '%s must not copy .env files into the image\n' "$DOCKERFILE" >&2
  exit 1
fi

printf 'game image configuration test passed\n'
