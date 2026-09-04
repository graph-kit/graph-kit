# @canvas/surface

Vue 3 component and composable for interactive HTML5 canvas rendering. Provides camera controls (pan/zoom), coordinate transformation between screen and world space, and background pattern support.

It also owns the aggregator every frame is painted from, along with the animated shape
factories and renderer behind it, so anything holding a surface can push canvas elements
without a graph in the picture. Every frame is that aggregator's draw, so painting means
contributing canvas elements to it rather than reaching for the context.

**Key exports:** `useCanvas`, `CanvasSurface.vue`
