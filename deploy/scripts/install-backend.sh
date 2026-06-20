#!/usr/bin/env bash

set -euo pipefail

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
quadlet_dir=${QUADLET_DIR:-$HOME/.config/containers/systemd}
config_dir=${BACKEND_CONFIG_DIR:-$HOME/.config/baka}
env_file="$config_dir/backend.env"

install -d -m 755 "$quadlet_dir"
install -m 644 "$root_dir/deploy/quadlet/baka-backend.container" "$quadlet_dir/baka-backend.container"
install -d -m 700 "$config_dir"

if [[ ! -e "$env_file" ]]; then
  install -m 600 "$root_dir/deploy/config/backend.env.example" "$env_file"
  chmod 600 "$env_file"
  printf 'fill in backend.env before deployment: %s\n' "$env_file" >&2
  exit 2
fi

chmod 600 "$env_file"

if grep -Eq '=(replace-me|postgresql://user:password@host:)' "$env_file"; then
  printf 'replace placeholder values before deployment: %s\n' "$env_file" >&2
  exit 2
fi

printf 'installed backend Quadlet configuration\n'
