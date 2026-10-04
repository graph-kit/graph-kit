# annotations

Freehand drawing, erasing and a laser pointer over the canvas, on top of everything the graph renders.

| Export        | Dependencies | Optional dependencies |
| ------------- | ------------ | --------------------- |
| `annotations` | `canvas`     | `history`             |

**Controls:** everything on `AnnotationsControls`, plus `theme` and `lifecycle`

**Events:** `onAnnotationsChanged`

**Transit:** the committed annotations, in paint order

The state and the tools themselves live in `@core/annotations`, which knows nothing about
graphs. This plugin is the wiring: it hands the engine the pointer ahead of every handler
that acts on the graph, paints what the engine returns through the aggregator, keeps the
strokes in the encoded payload, and asks `history` for a snapshot whenever the set of
annotations changes. A product with a canvas and no graph binds the same engine itself.
