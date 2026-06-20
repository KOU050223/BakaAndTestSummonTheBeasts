#!/usr/bin/env bash

set -euo pipefail

TEST_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

for test_script in \
  deploy-backend-test.sh \
  image-config-test.sh \
  install-backend-test.sh \
  quadlet-test.sh \
  workflow-test.sh; do
  "$TEST_DIR/$test_script"
done
