#!/usr/bin/env bash

set -euo pipefail

URL="${1:?usage: wait-for-server.sh <url>}"
ATTEMPTS="${2:-60}"

for attempt in $(seq 1 "$ATTEMPTS"); do
  if curl --silent --fail --output /dev/null "$URL"; then
    echo "$URL answered after ${attempt} attempt(s)"
    exit 0
  fi
  sleep 2
done

echo "no answer from $URL after $((ATTEMPTS * 2))s" >&2
exit 1
