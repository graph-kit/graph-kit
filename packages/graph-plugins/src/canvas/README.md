# canvas

Owns the drawing surface. Aggregates every shape plugins want rendered, runs the animation loop, tracks what sits under the cursor, and re-emits DOM mouse and keyboard events as graph-aware ones.

| Export                | Dependencies | Optional dependencies |
| --------------------- | ------------ | --------------------- |
| `canvas(magicCanvas)` | none         | none                  |

**Controls:** `aggregator`, `shapes`, `renderer`, `graphUnderCursor`, `getNodePriority`, `theme`, `events`

**Events:** `onClick`, `onDblClick`, `onContextMenu`, `onMouseDown`, `onMouseMove`, `onMouseUp`, `onKeyDown`, `onKeyUp`, `onBeforeDraw`, `onDraw`, `onGraphUnderCursorChange`, `onHoveredElementChange`

**Transit:** pan and zoom.

The aggregator itself lives in `@canvas/primitives`, which knows nothing about graphs.
This plugin owns an instance of it, republishes its two draw hooks as `onBeforeDraw` and
`onDraw`, and layers the graph-specific parts on top: node paint priority, cursor
resolution, and the hit test results reported as `graphUnderCursor`.
