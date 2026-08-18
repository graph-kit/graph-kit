import {
  type EventHub,
  createEventHub,
} from '@graph/primitives/events/createEventHub';
import type { EventMapToEventRegistry } from '@graph/primitives/events/types';

import { type Ref, onMounted } from 'vue';

/**
 * native dom events landing on the canvas element, handed on untouched.
 * anything that needs them in world coordinates or paired with what sits under
 * the cursor builds that on top.
 */
export type CanvasDOMEvents = {
  onClick: (ev: MouseEvent) => void;
  /** every click in the page, including ones the canvas never sees */
  onDocumentClick: (ev: MouseEvent) => void;
  onMouseDown: (ev: MouseEvent) => void;
  onMouseUp: (ev: MouseEvent) => void;
  onMouseMove: (ev: MouseEvent) => void;
  onDblClick: (ev: MouseEvent) => void;
  onContextMenu: (ev: MouseEvent) => void;
  onWheel: (ev: WheelEvent) => void;
  onFocus: (ev: FocusEvent) => void;
  onBlur: (ev: FocusEvent) => void;
};

type CanvasDOMEventRegistry = EventMapToEventRegistry<CanvasDOMEvents>;

const createCanvasDOMEventRegistry = (): CanvasDOMEventRegistry => ({
  onClick: new Set(),
  onDocumentClick: new Set(),
  onMouseDown: new Set(),
  onMouseUp: new Set(),
  onMouseMove: new Set(),
  onDblClick: new Set(),
  onContextMenu: new Set(),
  onWheel: new Set(),
  onFocus: new Set(),
  onBlur: new Set(),
});

type Binding = {
  bind: (element: HTMLElement) => void;
  unbind: (element: HTMLElement) => void;
};

/**
 * pairs a listener with the element methods that add and remove it, so the
 * event name is written once and the listener's argument stays typed after the
 * event name is erased to store bindings side by side in a list.
 */
const createBinding = <EventName extends keyof HTMLElementEventMap>(
  event: EventName,
  listener: (ev: HTMLElementEventMap[EventName]) => void,
  options?: AddEventListenerOptions,
): Binding => ({
  bind: (element: HTMLElement) =>
    element.addEventListener(event, listener, options),
  unbind: (element: HTMLElement) =>
    element.removeEventListener(event, listener),
});

/**
 * for events that finish what another event started, since the cursor is free to leave
 * the canvas mid gesture and the element never hears the end of one it began
 */
const createDocumentBinding = <EventName extends keyof DocumentEventMap>(
  event: EventName,
  listener: (ev: DocumentEventMap[EventName]) => void,
  options?: AddEventListenerOptions,
): Binding => ({
  bind: () => document.addEventListener(event, listener, options),
  unbind: () => document.removeEventListener(event, listener),
});

const createBindings = (emit: EventHub<CanvasDOMEvents>['emit']): Binding[] => [
  createBinding('click', (ev) => emit('onClick', ev)),
  createDocumentBinding('click', (ev) => emit('onDocumentClick', ev)),
  createBinding('mousedown', (ev) => emit('onMouseDown', ev)),
  createDocumentBinding('mouseup', (ev) => emit('onMouseUp', ev)),
  createBinding('focus', (ev) => emit('onFocus', ev)),
  createBinding('blur', (ev) => emit('onBlur', ev)),
  createBinding('mousemove', (ev) => emit('onMouseMove', ev)),
  createBinding('dblclick', (ev) => emit('onDblClick', ev)),
  createBinding('contextmenu', (ev) => emit('onContextMenu', ev)),
  // subscribers preventDefault on wheel to keep the page from scrolling, which a passive listener cannot do
  createBinding('wheel', (ev) => emit('onWheel', ev), { passive: false }),
];

/**
 * binds listeners to the canvas element once it is in the DOM and republishes
 * them on an event hub, so consumers subscribe instead of reaching for the
 * element and owning their own teardown.
 */
export const useDOMEvents = (canvas: Ref<HTMLCanvasElement | undefined>) => {
  const events = createEventHub(createCanvasDOMEventRegistry());

  const bindings = createBindings(events.emit);

  onMounted(() => {
    if (!canvas.value)
      throw new Error('Canvas not found in DOM. Check ref link.');
    for (const binding of bindings) binding.bind(canvas.value);
  });

  return {
    events,
    cleanup: (ref: HTMLCanvasElement) => {
      for (const binding of bindings) binding.unbind(ref);
    },
  };
};
