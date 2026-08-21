import {
  type EventHub,
  type ReadonlyEventHub,
  createEventHub,
} from '@core/events/createEventHub';
import type { EventMapToEventRegistry } from '@core/events/types';

import { type DocumentBinding, createDocumentBinding } from './bindings.ts';
import type { CanvasLifecycleEvents } from './lifecycle.ts';

export type DocumentBoundEvents = {
  onClick: (ev: MouseEvent) => void;
  onMouseDown: (ev: MouseEvent) => void;
  onMouseUp: (ev: MouseEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
  onKeyUp: (ev: KeyboardEvent) => void;
};

const createDocumentBoundEventRegistry =
  (): EventMapToEventRegistry<DocumentBoundEvents> => ({
    onClick: new Set(),
    onMouseDown: new Set(),
    onMouseUp: new Set(),
    onKeyDown: new Set(),
    onKeyUp: new Set(),
  });

const createBindings = (
  emit: EventHub<DocumentBoundEvents>['emit'],
): DocumentBinding[] => [
  createDocumentBinding('click', (ev) => emit('onClick', ev)),
  createDocumentBinding('mousedown', (ev) => emit('onMouseDown', ev)),
  createDocumentBinding('mouseup', (ev) => emit('onMouseUp', ev)),
  createDocumentBinding('keydown', (ev) => emit('onKeyDown', ev)),
  createDocumentBinding('keyup', (ev) => emit('onKeyUp', ev)),
];

export const createDocumentBoundEvents = (
  lifecycle: Pick<ReadonlyEventHub<CanvasLifecycleEvents>, 'subscribe'>,
) => {
  const events = createEventHub(createDocumentBoundEventRegistry());
  const bindings = createBindings(events.emit);

  lifecycle.subscribe('onMounted', () => {
    for (const binding of bindings) binding.bind();
  });

  lifecycle.subscribe('onBeforeUnmount', () => {
    for (const binding of bindings) binding.unbind();
  });

  return events;
};
