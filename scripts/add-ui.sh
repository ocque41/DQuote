#!/usr/bin/env bash
# Usage: ./scripts/add-ui.sh button
# Looks up the matching component JSON in the local registry and installs via shadcn CLI.

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <component-json-name-without-extension>" >&2
  exit 1
fi

COMPONENT="$1"
REGISTRY_DIR="$(dirname "$0")/../registry"
FILE="$REGISTRY_DIR/${COMPONENT}.json"

if [ ! -f "$FILE" ]; then
  echo "Component JSON not found: $FILE" >&2
  exit 1
fi

CI=1 npx --yes shadcn@latest add "$FILE"
