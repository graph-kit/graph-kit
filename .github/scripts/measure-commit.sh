#!/usr/bin/env bash

set -euo pipefail

REF="${1:?usage: measure-commit.sh <ref> <output.json>}"
OUTPUT="${2:?usage: measure-commit.sh <ref> <output.json>}"

WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"
WORKTREE="$(mktemp -d)/under-test"
LOG="$(mktemp)"

cleanup() {
  pkill -f "nuxt.mjs dev" || true
  # the dev lock outlives the process by a moment and the next server is
  # already on its way in
  sleep 2
  git -C "$WORKSPACE" worktree remove --force "$WORKTREE" || true
}
trap cleanup EXIT

echo "::group::preparing $REF"
git -C "$WORKSPACE" worktree add --detach "$WORKTREE" "$REF"
cd "$WORKTREE"
pnpm install --frozen-lockfile
echo "::endgroup::"

echo "::group::serving $REF"
pnpm --filter client dev > "$LOG" 2>&1 &
if ! "$WORKSPACE/.github/scripts/wait-for-server.sh" "$PERF_URL"; then
  echo "server never came up. last of its output:" >&2
  tail -40 "$LOG" >&2
  exit 1
fi
echo "::endgroup::"

cd "$WORKSPACE"
pnpm --filter @graph/perf-harness run measure \
  --url "$PERF_URL" \
  --out "$OUTPUT" \
  --commit "$(git -C "$WORKTREE" rev-parse HEAD)"
