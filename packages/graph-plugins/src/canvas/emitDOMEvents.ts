import type { SurfaceEvents } from '@canvas/surface/events/index';
import { EventHub } from '@core/events/createEventHub';
import { isTypingTarget } from '@core/utils/keyboard';
import { KeyboardEventMap } from '@core/utils/types';

import {
  CanvasEventMap,
  CanvasGraphMouseEvent,
  MOUSE_EVENT_NAMES,
} from './events.ts';

/**
 * republishes the surface's element resolved mouse events as canvas events. the surface
 * already paired each one with what was drawn under it, so this only moves them onto the
 * hub plugins order themselves against.
 */
export const emitMouseEvents = (
  elements: SurfaceEvents['elements'],
  emit: EventHub<CanvasEventMap>['emit'],
) => {
  for (const eventName of MOUSE_EVENT_NAMES) {
    elements.subscribe(eventName, (ev: CanvasGraphMouseEvent) =>
      emit(eventName, ev),
    );
  }
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
