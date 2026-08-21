import {
  type EventHub,
  type ReadonlyEventHub,
  createEventHub,
} from '@core/events/createEventHub';
import type { EventMapToEventRegistry } from '@core/events/types';
import { nullThrows } from '@core/utils/assert';

import type { Ref } from 'vue';

import { CANVAS_MISSING } from '../constants.ts';
import { type ElementBinding, createBinding } from './bindings.ts';
import type { CanvasLifecycleEvents } from './lifecycle.ts';

export type CanvasBoundEvents = {
  onClick: (ev: MouseEvent) => void;
  onMouseDown: (ev: MouseEvent) => void;
  onMouseMove: (ev: MouseEvent) => void;
  onDblClick: (ev: MouseEvent) => void;
  onContextMenu: (ev: MouseEvent) => void;
  onWheel: (ev: WheelEvent) => void;
  onFocus: (ev: FocusEvent) => void;
  onBlur: (ev: FocusEvent) => void;
};

const createCanvasBoundEventRegistry =
  (): EventMapToEventRegistry<CanvasBoundEvents> => ({
    onClick: new Set(),
    onMouseDown: new Set(),
    onMouseMove: new Set(),
    onDblClick: new Set(),
    onContextMenu: new Set(),
    onWheel: new Set(),
    onFocus: new Set(),
    onBlur: new Set(),
  });

const createBindings = (
  emit: EventHub<CanvasBoundEvents>['emit'],
): ElementBinding[] => [
  createBinding('click', (ev) => emit('onClick', ev)),
  createBinding('mousedown', (ev) => emit('onMouseDown', ev)),
  createBinding('mousemove', (ev) => emit('onMouseMove', ev)),
  createBinding('dblclick', (ev) => emit('onDblClick', ev)),
  createBinding('contextmenu', (ev) => emit('onContextMenu', ev)),
  createBinding('focus', (ev) => emit('onFocus', ev)),
  createBinding('blur', (ev) => emit('onBlur', ev)),
  // subscribers preventDefault on wheel to keep the page from scrolling, which a passive listener cannot do
  createBinding('wheel', (ev) => emit('onWheel', ev), { passive: false }),
];

export const createCanvasBoundEvents = (
  canvas: Ref<HTMLCanvasElement | undefined>,
  lifecycle: Pick<ReadonlyEventHub<CanvasLifecycleEvents>, 'subscribe'>,
) => {
  const events = createEventHub(createCanvasBoundEventRegistry());
  const bindings = createBindings(events.emit);

  lifecycle.subscribe('onMounted', () => {
    const element = nullThrows(canvas.value, CANVAS_MISSING);
    for (const binding of bindings) binding.bind(element);
  });

  lifecycle.subscribe('onBeforeUnmount', () => {
    const element = nullThrows(canvas.value, CANVAS_MISSING);
    for (const binding of bindings) binding.unbind(element);
  });

  return events;
};
