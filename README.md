# Welcome To Graph Kit 👋

The Progressive, TypeScript Native, Framework Agnostic Graph SDK.

## Concise & Declarative

```ts
const graph = createGraph({
  plugins: [history, surface, focus, interactive],
  themes: { light, dark, cosmicOrange },
});
```

## Rich First-Party Plugins

Import only the plugins you use; the rest never reaches your bundle. Your plugins are built on the same public API.

```ts
import { focus } from '@graph/plugins/focus';
import { surface } from '@graph/plugins/surface';
```

| Plugin              | What It Does                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **surface**         | render the graph to a canvas surface                                                      |
| **interactive**     | gestures such as double-clicking to add a node                                            |
| **nodeDrag**        | pick up nodes and move them around                                                        |
| **focus**           | highlight nodes and edges                                                                 |
| **history**         | undo and redo                                                                             |
| **characteristics** | run lazy computations against the graph for connectedness, completeness, cycles, and more |

> [!TIP]
> Graph Kit ships with over a dozen first-party plugins; see
> [`packages/graph-plugins`](./packages/graph-plugins) for the full list.

## Development

Node 24+ and pnpm. From the repo root:

```sh
pnpm install
pnpm dev
```

See [SETUP.md](./SETUP.md) for the full script list and repo layout.

> [!WARNING]
> Graph Kit is in **early alpha**. Expect breaking changes!
