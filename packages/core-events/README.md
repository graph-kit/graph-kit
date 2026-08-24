# @core/events

The event hub every subsystem publishes through, and the priority handler behind it.

`createEventHub` gives a typed `subscribe`/`unsubscribe`/`emit` trio over an event registry.
`handle` sits alongside `subscribe` for listeners that can claim an event: a handler calls
`consume()` to stop the ones ordered after it from seeing it at all, which is how the
annotation tools take the pointer ahead of anything that would act on what is underneath.
Ordering is declared relationally, `{ before: [...] }` against other handler ids, rather
than as a number nobody can pick correctly in isolation.

Nothing here knows about graphs or canvases. The graph core, the canvas surface, the
annotation engine and the shell all build their own event maps on top of it.
