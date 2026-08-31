# Graph Kit First Party Plugins

## Rendering & Interaction

| Plugin                                      | What It Does                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| [`surface`](./src/surface/index.ts)         | Hands the graph its drawing surface, plus paint priority and cursors.  |
| [`interactive`](./src/interactive/index.ts) | Build the graph on the surface: add nodes, link them, edit weights.    |
| [`nodeDrag`](./src/node-drag/index.ts)      | Click-and-drag repositioning, including a whole multi-node selection.  |
| [`anchors`](./src/anchors/index.ts)         | Draggable handles on a hovered node for pulling out a new edge.        |
| [`marquee`](./src/marquee/index.ts)         | Drag a box on empty canvas to select everything it encloses.           |
| [`focus`](./src/focus/index.ts)             | Tracks the current selection and themes it accordingly.                |
| [`phantom`](./src/phantom/index.ts)         | Ghost nodes and edges that render but aren't in the graph data.        |
| [`nodeLabel`](./src/node-label/index.ts)    | Labels on nodes, auto-generated A, B, C... for new ones.               |
| [`annotations`](./src/annotations/index.ts) | Freehand drawing, erasing, and a laser pointer over the canvas.        |
| [`animation`](./src/animation/index.ts)     | Interpolates between before and after frames instead of snapping.      |
| [`history`](./src/history/index.ts)         | Undo and redo, as full graph snapshots rather than inverse actions.    |
| [`readonly`](./src/readonly/index.ts)       | Holds every plugin that can write to the graph disabled while entered. |

## Graph Analysis

Pure computation, no rendering.

| Plugin                                                          | What It Does                                              |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| [`adjacencyLists`](./src/adjacency-lists/index.ts)              | Adjacency lists, plain and weighted.                      |
| [`characteristics`](./src/characteristics/index.ts)             | Completeness, connectedness, bipartiteness, cycles, SCCs. |
| [`minimumSpanningTrees`](./src/minimum-spanning-trees/index.ts) | Every MST of the graph, or every minimum spanning forest. |
| [`transitionMatrix`](./src/transition-matrix/index.ts)          | A node-by-node matrix of exact fractions.                 |
