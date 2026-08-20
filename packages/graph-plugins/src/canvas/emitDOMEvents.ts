import { CanvasDOMEvents } from '@canvas/surface/domEvents';
import { EventHub, ReadonlyEventHub } from '@core/events/createEventHub';
import { isTypingTarget } from '@core/utils/keyboard';
import { KeyboardEventMap } from '@core/utils/types';

import { CanvasEventMap, CanvasGraphMouseEvent } from './events.ts';

/**
 * republishes the surface's mouse events as canvas events, each one carrying
 * the graph elements sitting under the point it happened at.
 */
export const emitMouseEvents = (
  domEvents: ReadonlyEventHub<CanvasDOMEvents>,
  graphMouseEvent: (ev: MouseEvent) => CanvasGraphMouseEvent,
  emit: EventHub<CanvasEventMap>['emit'],
) => {
  domEvents.subscribe('onClick', (ev) => emit('onClick', graphMouseEvent(ev)));
  domEvents.subscribe('onMouseMove', (ev) =>
    emit('onMouseMove', graphMouseEvent(ev)),
  );
  domEvents.subscribe('onMouseDown', (ev) =>
    emit('onMouseDown', graphMouseEvent(ev)),
  );
  domEvents.subscribe('onMouseUp', (ev) =>
    emit('onMouseUp', graphMouseEvent(ev)),
  );
  domEvents.subscribe('onDblClick', (ev) =>
    emit('onDblClick', graphMouseEvent(ev)),
  );
  domEvents.subscribe('onContextMenu', (ev) =>
    emit('onContextMenu', graphMouseEvent(ev)),
  );
};

/**
 * keyboard listeners live on document rather than the canvas element, so every
 * keystroke in the page reaches them, including ones aimed at a product side
 * panel or an edge weight textarea. those get dropped here so canvas keybinds
 * cannot swallow what the user is typing.
 */
export const emitKeyboardEvents = (
  emit: EventHub<CanvasEventMap>['emit'],
): Partial<KeyboardEventMap> => ({
  keydown: (ev: KeyboardEvent) => {
    if (isTypingTarget(ev)) return;
    emit('onKeyDown', ev);
  },
  keyup: (ev: KeyboardEvent) => {
    if (isTypingTarget(ev)) return;
    emit('onKeyUp', ev);
  },
});
