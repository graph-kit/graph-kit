# surface

Hands the graph its drawing surface, spread flat as controls, and layers on the parts that only make sense with a graph behind them: node paint priority, cursor token resolution, and the theme detectors that read what sits under the pointer.

| Export    | Dependencies | Optional dependencies |
| --------- | ------------ | --------------------- |
| `surface` | none         | none                  |

**Controls:** the whole `CanvasSurface` spread flat (`aggregator`, `events`, `camera`,
`shapes`, `renderer`, `elementsUnderCursor`, `draw`, …) plus `getNodePriority` and `theme`.
Reach them as `graph.surface.aggregator`, `graph.surface.events`, `graph.surface.theme`.

**Events:** none. input and frame events come off the surface directly: `surface.events.canvas`
and `surface.events.dom` for raw DOM, `surface.events.elements` for the same input resolved
against what is drawn, and `aggregator.events` for the frame.

**Transit:** pan and zoom.

It calls `useCanvasSurface` itself rather than taking one, so a graph is the whole
description of what it needs and nothing upstream has to build a surface to hand down. Vue
lifecycle applies: create the graph from a setup context.

The aggregator lives in `@canvas/primitives` and is owned by `@canvas/surface`, neither of
which knows anything about graphs. This plugin owns no input of its own: it layers the
graph-specific parts on top, namely node paint priority, cursor resolution, and the theme
detectors that read what sits under the pointer.
