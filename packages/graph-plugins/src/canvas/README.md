# canvas

Binds the graph to a drawing surface. Feeds every shape plugins want rendered into the surface's aggregator, tracks what sits under the cursor, and re-emits DOM mouse and keyboard events as graph-aware ones.

| Export                | Dependencies | Optional dependencies |
| --------------------- | ------------ | --------------------- |
| `canvas(magicCanvas)` | none         | none                  |

**Controls:** `aggregator`, `shapes`, `renderer`, `graphUnderCursor`, `getNodePriority`, `theme`, `events`

**Events:** `onClick`, `onDblClick`, `onContextMenu`, `onMouseDown`, `onMouseMove`, `onMouseUp`, `onKeyDown`, `onKeyUp`, `onBeforeDraw`, `onDraw`, `onGraphUnderCursorChange`, `onHoveredElementChange`

**Transit:** pan and zoom.

The aggregator lives in `@canvas/primitives` and is owned by `@canvas/surface`, neither of
which knows anything about graphs. This plugin takes the surface's instance, republishes
its events as `onBeforeDraw` and `onDraw`, and layers the graph-specific parts on top:
node paint priority, cursor resolution, and the hit test results reported as
`graphUnderCursor`.
