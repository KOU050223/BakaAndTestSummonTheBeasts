#!/usr/bin/env bash

set -euo pipefail

commit_sha=${1:-}

if [[ ! "$commit_sha" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'error: expected a 40-character lowercase commit SHA\n' >&2
  exit 2
fi

image_repository=${GAME_IMAGE_REPOSITORY:-ghcr.io/kou050223/baka-and-test-summon-the-beasts-game}
deploy_env_file=${DEPLOY_ENV_FILE:-$HOME/.config/baka/game.env}
deploy_state_dir=${DEPLOY_STATE_DIR:-$HOME/.local/state/baka}
service_name=${GAME_SERVICE_NAME:-baka-game.service}
health_url=${GAME_HEALTH_URL:-http://127.0.0.1:8080/healthz}
health_attempts=${GAME_HEALTH_ATTEMPTS:-12}
image="$image_repository:$commit_sha"
current_image=localhost/baka-game:current
previous_image=localhost/baka-game:previous

if [[ ! -r "$deploy_env_file" ]]; then
  printf 'error: deployment environment file is not readable: %s\n' "$deploy_env_file" >&2
  exit 1
fi

mkdir -p "$deploy_state_dir"

podman pull "$image"

has_previous_image=0
if podman image exists "$current_image"; then
  podman tag "$current_image" "$previous_image"
  has_previous_image=1
fi

podman tag "$image" "$current_image"
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
systemctl --user daemon-reload
restart_failed=0
if ! systemctl --user restart "$service_name"; then
  restart_failed=1
fi

wait_for_health() {
  local attempt

  for ((attempt = 1; attempt <= health_attempts; attempt += 1)); do
    if curl --fail --silent --show-error --max-time 5 "$health_url" >/dev/null; then
      return 0
    fi
    sleep 5
  done

  return 1
}

if ((restart_failed == 1)) || ! wait_for_health; then
  if ((restart_failed == 1)); then
    printf 'error: service restart failed for %s\n' "$commit_sha" >&2
  else
    printf 'error: health check failed for %s\n' "$commit_sha" >&2
  fi

  if ((has_previous_image == 0)); then
    systemctl --user stop "$service_name" || true
    printf 'error: no previous image is available for rollback\n' >&2
    exit 1
  fi

  podman tag "$previous_image" "$current_image"
  if ! systemctl --user restart "$service_name"; then
    printf 'error: rollback service restart failed\n' >&2
    exit 1
  fi

  if wait_for_health; then
    printf 'rollback succeeded; previous game image is running\n' >&2
    exit 1
  fi

  printf 'error: rollback health check failed\n' >&2
  exit 1
fi

state_file="$deploy_state_dir/game-current-sha"
printf '%s\n' "$commit_sha" >"$state_file.tmp"
mv "$state_file.tmp" "$state_file"
printf 'deployed game commit %s\n' "$commit_sha"
