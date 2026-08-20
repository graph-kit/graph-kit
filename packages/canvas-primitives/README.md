# @canvas/primitives

Drawable shape primitives used to render graph elements on canvas. Provides 12+ shapes (circle, rect, arrow, triangle, star, etc.) with animation support and schema-based configuration.

Also holds the aggregator: the list of canvas elements a frame is drawn from, the
transformer pipeline that builds it, and the hit test that answers what sits under a
point. It knows nothing about graphs, so anything holding a canvas can drive one.

**Key exports:** `shapes`, `createAggregator`
