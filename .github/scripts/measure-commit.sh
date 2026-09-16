#!/usr/bin/env bash
# Serves one commit and measures it.
#
# The commit under test goes in a worktree rather than into the checkout, so
# the harness driving the browser is always the one from the default branch.
# That distinction is the whole point: a pull request opened before this
# tooling existed does not carry a copy of it, and a pull request is free to
# change the harness in ways that would quietly change what the numbers mean.
# Tooling from main, code under test in a worktree.

set -euo pipefail

REF="${1:?usage: measure-commit.sh <ref> <output.json>}"
OUTPUT="${2:?usage: measure-commit.sh <ref> <output.json>}"

WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"
WORKTREE="$(mktemp -d)/under-test"
LOG="$(mktemp)"

cleanup() {
  # nuxt's own process, not the pnpm wrapper that spawned it
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
