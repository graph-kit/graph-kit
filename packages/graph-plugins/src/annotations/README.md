# annotations

Freehand drawing, erasing and a laser pointer over the canvas, on top of everything the graph renders.

| Export        | Dependencies | Optional dependencies                       |
| ------------- | ------------ | ------------------------------------------- |
| `annotations` | `canvas`     | `anchors`, `history`, `marquee`, `nodeDrag` |

**Controls:** everything on `AnnotationsControls`, plus `theme` and `lifecycle`

**Events:** `onAnnotationsChanged`

**Transit:** the committed annotations, in paint order

The state and the tools themselves live in `@core/annotations`, which knows nothing about
graphs. This plugin is the wiring: it hands the engine the pointer ahead of every handler
that acts on the graph, paints what the engine returns through the aggregator, keeps the
strokes in the encoded payload, and asks `history` for a snapshot whenever the set of
annotations changes. A product with a canvas and no graph binds the same engine itself.

While the tools are out, `marquee`, `anchors` and `nodeDrag` are held disabled, so nothing
they were showing when the tools came out stays frozen on the canvas. Each one has to be
folded ahead of annotations to be held.
