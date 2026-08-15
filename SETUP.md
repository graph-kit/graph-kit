# Setup

## Prerequisites

- **Node 24+** — this repo's `.nvmrc` pins `24.12.0`. If you use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm), `cd`-ing into this repo will pick up the right version automatically (as long as your shell is configured with `--use-on-cd` / equivalent auto-switching).
- **pnpm** — this is a pnpm workspace monorepo (see `pnpm-workspace.yaml`). Install via `corepack enable` or `npm i -g pnpm`.

## Install

From the repo root:

```sh
pnpm install
```

This installs dependencies for every package in `packages/*`.

## Run the client

```sh
pnpm dev
```

This runs two processes in parallel:

- `@magic/client`'s dev server (Nuxt) on **:3000**, with hot module replacement.
- `@multiplayer/server`, the room server, on **:4000**, with restart-on-change via `tsx watch`.

The client points at `http://localhost:4000` automatically in dev, so multiplayer works locally with no extra setup: open a product, press **Start room**, and paste the URL into a second window to join it.

Run them separately with `pnpm dev:client` and `pnpm dev:server` if you only need one.

**Ports.** The room server sits on 4000 rather than 3001 because Nuxt auto-increments into 3001, 3002 and so on whenever a port is taken, so a second client would otherwise claim it. Override with `PORT` on the server and `MULTIPLAYER_SERVER_URL` on the client.

**Turning multiplayer off.** `MULTIPLAYER_SERVER_URL=` (empty) runs the app with multiplayer disabled entirely. That is also the default for any non-dev build, so a deployment without a room server is a normal configuration rather than a broken one.

## Build the client

```sh
pnpm build
```

Runs `nuxt generate` for `@magic/client`, producing a static site in `packages/magic-client/.output/public` — deployable to any static host (e.g. Netlify) with no server process required.

## Build the room server

```sh
pnpm --filter @multiplayer/server build
```

Bundles to `packages/multiplayer-server/dist/index.js` with esbuild, then runs with `node`. It bundles rather than emitting plain `tsc` output because workspace packages are published as raw `.ts` through their `exports` maps, which Node cannot load directly. `railway.toml` in that package carries the deploy config.

## Other useful scripts

- `pnpm test` — runs the vitest suite across all packages.
- `pnpm format` — formats the repo with Prettier.
- `pnpm build:types` — type-checks and builds declaration files across all workspace packages via TypeScript project references.
- `pnpm format:check` — verifies formatting without rewriting files (what CI runs).
- `pnpm clean` — removes all `dist` folders and TypeScript build caches.
- `pnpm clean:nuke` — `pnpm clean`, plus wipes `node_modules`, then reinstalls and rebuilds types. Use this if something in the workspace gets into a weird state.

## Repo structure

- `packages/magic-client` — the Magic Graphs site (Nuxt, SSG).
- `packages/core-components` — shared, colorless component library (Reka UI + Tailwind), consumed by product code.
- `packages/core-utils` — shared utility functions.
- `packages/graph-*` — the framework-agnostic graph engine (Graph Kit) and its plugins/primitives.
- `packages/canvas-*` - Infinite Canvas engine.
- `packages/magic-products` — Magic Graphs product experiences.
- `packages/multiplayer-protocol` — the client/server wire contract: room state shape, patch ops, privilege tiers. Zero dependencies, shared by both sides.
- `packages/multiplayer-server` — the room server (socket.io). Graph-agnostic: it holds opaque per-product state, applies patches to it and enforces privileges, without knowing what a node or an edge is.
