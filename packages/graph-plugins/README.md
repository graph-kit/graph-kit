# Graph Kit First Party Plugins

## Rendering & Interaction

| Plugin                                      | What It Does                                                                                                                                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`canvas`](./src/canvas/index.ts)           | Owns the drawing surface: aggregates every shape plugins want rendered, runs the animation loop, tracks what sits under the cursor, and re-emits DOM mouse/keyboard events as graph-aware ones. |
| [`interactive`](./src/interactive/index.ts) | Lets users build the graph directly on the canvas: double-click to create a node, drag between nodes to link them, edit edge weights, delete selections.                                        |
| [`nodeDrag`](./src/node-drag/index.ts)      | Handles click-and-drag repositioning of nodes, including dragging a whole multi-node selection at once.                                                                                         |
| [`anchors`](./src/anchors/index.ts)         | Spawns draggable handles around a hovered node so you can pull a new edge out of it, with a live preview line while dragging.                                                                   |
| [`marquee`](./src/marquee/index.ts)         | Drag-a-box selection on empty canvas, selecting every node and edge the box encloses.                                                                                                           |
| [`focus`](./src/focus/index.ts)             | Tracks which nodes and edges are currently selected and themes them accordingly, supporting click, shift-click, and programmatic selection.                                                     |
| [`phantom`](./src/phantom/index.ts)         | Renders "ghost" nodes and edges that look real but aren't part of the graph data, useful for previews, hints, and algorithm visualizations.                                                     |
| [`nodeLabel`](./src/node-label/index.ts)    | Attaches human-readable labels to nodes, auto-generating A, B, C... for new ones, and draws them on the node.                                                                                   |
| [`animation`](./src/animation/index.ts)     | Captures before/after frames around a change so the canvas tweens between them instead of snapping.                                                                                             |
| [`history`](./src/history/index.ts)         | Undo/redo, implemented as full graph snapshots rather than inverse actions so plugin-owned state (labels, etc.) is restored too.                                                                |

## Graph analysis

Pure computation, no rendering.

| Plugin                                                 | What it does                                                                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`adjacencyLists`](./src/adjacency-lists/index.ts)     | Derives adjacency lists from the graph, plain and weighted and direction-aware, as the shared substrate other analysis plugins build on.                         |
| [`characteristics`](./src/characteristics/index.ts)    | Answers structural questions about the graph: is it complete, connected, bipartite; what are its cycles, strongly connected components, and bidirectional edges. |
| [`transitionMatrix`](./src/transition-matrix/index.ts) | Turns the weighted adjacency list into a node-by-node matrix of exact fractions, for Markov-chain style work.                                                    |
