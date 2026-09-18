# @core/events

The event hub every subsystem publishes through.

## Core

`subscribe`/`unsubscribe` sets up/tears down passive listener.

`emit` triggers a broadcast invoking subscribers and handlers.

## Handlers

`handle` sits alongside `subscribe` for listeners that can claim an event.

Handlers are exactly like `subscribe` but with the special ability to call `consume()` to stop the handlers after it from being invoked.
