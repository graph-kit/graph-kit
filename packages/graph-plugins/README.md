# @graph/plugins

Plugins for the graph SDK. Each one is a self-contained unit of behavior that layers onto the core graph: rendering, interaction, and analysis.

## Rendering & interaction

| Plugin                                      | What it does                                                                                                                                                                                    |
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

## Authoring

**If it's a property of the element, it's an action option. If it's a property of the view, it's a control call.**

A label is element data, so `nodeLabel` extends `addNode` with a `label` option and wraps the action to record it. Focus and animation are view state that happened to be triggered by a data change, so they live at `controls.focus.set()` and `controls.animation.auto()` and wrap nothing.

```ts
// element data, so it rides along with the action
actions.addNode({ position, label: 'A' });

// view state, so the caller drives it
const finalize = controls.animation.auto();
actions.removeElements({ nodes, edges: [] });
actions.addElements(nextState);
finalize();
controls.focus.set([nodeId]);
```

Three reasons the line sits here:

**A flag can only wrap one action, a control call can bracket a sequence.** The example above animates a full teardown and rebuild as one captured frame. An `animate: true` option on each action would have produced two frames and a flicker, so the shorter form was also the weaker one.

**Action options are a flat bag with no owner.** `{ animate: true, focus: false, label: 'A' }` is three plugins writing into one object literal, with the same collision risk that controls avoid by being namespaced per plugin. Anything reachable as `controls.myPlugin.*` announces who owns it.

**Wrapping an action is real authority, so keep the set of plugins holding it small.** A plugin that wraps `addNode` sits in the hot path of every consumer's `addNode`, and when two plugins wrap the same action their resolution order comes from `dependsOn` rather than from anything the consumer wrote. Worth it for element data, not worth it for a side effect the caller could have triggered directly.

Corollary: an action must be safe to call for its data effect alone. If a consumer calls `removeElements` and gets a camera pan they did not ask for, some plugin put view state on the wrong side of the line.

**To answer "what is on the canvas", read the aggregator, not `controls.nodes()`.**

This one reads backwards at first. The node list is right there, it is typed, and it looks like the authoritative answer. It is authoritative, but about the data model, not about the canvas. The aggregator is what survives every transformer in the pipeline, which makes it the authoritative view of what got drawn.

```ts
// what the graph contains
controls.nodes();

// what is drawn on the canvas this frame
controls.surface.aggregator.elements();
```

`anchors` never reads the node list to decide where to orbit. It sets its parent node from `onGraphUnderCursorChange`, and the cursor is recomputed off the freshly drawn aggregator every frame. `marquee` resolves which elements its box encloses by iterating the aggregator rather than iterating through the nodes.

The payoff is that visibility propagates on its own. When something stops being drawn, whether from culling, an animation, or a mechanism that does not exist yet, it leaves the aggregator and every plugin derived from it corrects itself without being told. A plugin that reaches around to the node list opts out of all of that silently, with nothing at compile time to warn it.

Analysis plugins are the deliberate exception. `adjacencyLists` and `characteristics` answer structural questions about the data, so the node list is the correct source for them. The rule is about anything that renders or responds to the cursor.

Render topology is the other exception, and unlike analysis it is a known gap rather than a considered choice. `parallelEdges` and `neighborPositions` read `controls.edges()` because they answer questions that have to be settled _before_ a shape exists, and the aggregator holds finished shapes. Laying out one edge requires knowing the others are there, and they only reach the aggregator once they already have geometry.

The consequence is that removing a graph element in a transformer does not remove it from layout. A culled edge keeps the slot it was assigned, so a fan of three draws with a hole in the middle and the two survivors sit a full slot further apart than they should. Reaching for the aggregator does not fix this: reading it here means reading last frame's output to build this frame's input, which trades a static hole for geometry that visibly settles.

[#813](https://github.com/graph-kit/graph-kit/issues/813) tracks the fix, a registry upstream of rendering that owns whether an element is drawn at all, so the render path and the topology callbacks resolve against one list. Until it lands, treat aggregator transformers as additive where graph elements are concerned. Add decorations freely, but do not filter out nodes or edges.

Corollary: if your plugin needs cleanup code to tear down an overlay when its subject disappears, it is probably reading the wrong source. Aggregator-derived state has nothing to clean up.
