#!/usr/bin/env bash

set -euo pipefail

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
quadlet_dir=${QUADLET_DIR:-$HOME/.config/containers/systemd}
config_dir=${GAME_CONFIG_DIR:-$HOME/.config/baka}
env_file="$config_dir/game.env"

install -d -m 755 "$quadlet_dir"
install -m 644 "$root_dir/deploy/quadlet/baka-game.container" "$quadlet_dir/baka-game.container"
install -d -m 700 "$config_dir"

if [[ ! -e "$env_file" ]]; then
  install -m 600 "$root_dir/deploy/config/game.env.example" "$env_file"
  chmod 600 "$env_file"
  printf 'fill in game.env before deployment: %s\n' "$env_file" >&2
  exit 2
fi

chmod 600 "$env_file"

if grep -Eq '=replace-me' "$env_file"; then
  printf 'replace placeholder values before deployment: %s\n' "$env_file" >&2
  exit 2
fi

printf 'installed game Quadlet configuration\n'
