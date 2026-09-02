# interactive

Lets users build the graph directly on the canvas: double-click to create a node, drag between nodes to link them, edit edge weights, delete selections.

While a node anchor is being dragged, every node the anchor could legally land on gets an amber border, and the one currently under the anchor turns red. With `phantom` installed, that node is also previewed as the edge a release would create, which is dropped on the tick the anchor lands.

| Export                 | Dependencies | Optional dependencies                    |
| ---------------------- | ------------ | ---------------------------------------- |
| `interactive(options)` | `canvas`     | `anchors`, `focus`, `history`, `phantom` |

**Controls:** `lifecycle`

**Options:** `newEdgeWeight`, `parseEdgeWeight`, `allowSelfLoops`, `allowRepeatConnections`, `recordHistory`
