#!/usr/bin/env bash

set -euo pipefail

TEST_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

for test_script in \
  deploy-backend-test.sh \
  deploy-game-test.sh \
  image-config-test.sh \
  image-config-game-test.sh \
  install-backend-test.sh \
  install-game-test.sh \
  quadlet-test.sh \
  quadlet-game-test.sh \
  seed-demo-test.sh \
  workflow-test.sh \
  workflow-game-test.sh; do
  "$TEST_DIR/$test_script"
done
