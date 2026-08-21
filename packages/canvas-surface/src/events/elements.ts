import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import {
  type ReadonlyEventHub,
  createEventHub,
} from '@core/events/createEventHub';
import type { EventMapToEventRegistry } from '@core/events/types';
import type { Coordinate } from '@core/utils/canvas/index';
import { DeepReadonly } from 'ts-essentials';

import type { Ref } from 'vue';

import type { CanvasBoundEvents } from './canvas.ts';
import type { DocumentBoundEvents } from './dom.ts';
import {
  type ElementMouseEventMap,
  createElementMouseEventRegistry,
  emitElementMouseEvents,
} from './elementMouseEvents.ts';

export type ElementsUnderCursor = {
  coords: Coordinate;
  /** every element whose hitbox contains the cursor, back to front */
  elements: CanvasElement[];
  /** the topmost element under the cursor, equivalent to `elements.at(-1)` */
  readonly topElement: CanvasElement | undefined;
};

export type ElementEvents = ElementMouseEventMap & {
  /** the cursor moved, or what sits beneath it changed */
  onElementsUnderCursorChange: (
    data: DeepReadonly<ElementsUnderCursor>,
  ) => void;
  /** only the topmost element changed, which is what a hover actually is */
  onHoveredElementChange: (
    newElement: DeepReadonly<CanvasElement> | undefined,
    oldElement: DeepReadonly<CanvasElement> | undefined,
  ) => void;
};

const createElementEventRegistry =
  (): EventMapToEventRegistry<ElementEvents> => ({
    ...createElementMouseEventRegistry(),
    onElementsUnderCursorChange: new Set(),
    onHoveredElementChange: new Set(),
  });

const sameElements = (previous: CanvasElement[], next: CanvasElement[]) => {
  if (previous.length !== next.length) return false;
  for (let i = 0; i < previous.length; i++) {
    if (previous[i].id !== next[i].id) return false;
  }
  return true;
};

type CreateElementsUnderCursorOptions = {
  aggregator: AggregatorControls;
  cursorCoordinates: Ref<Coordinate>;
  toWorldCoordinates: (ev: MouseEvent) => Coordinate;
  canvasEvents: Pick<ReadonlyEventHub<CanvasBoundEvents>, 'subscribe'>;
  domEvents: Pick<ReadonlyEventHub<DocumentBoundEvents>, 'subscribe'>;
};

export const createElementsUnderCursor = ({
  aggregator,
  cursorCoordinates,
  toWorldCoordinates,
  canvasEvents,
  domEvents,
}: CreateElementsUnderCursorOptions) => {
  const events = createEventHub(createElementEventRegistry());

  const elementsUnderCursor: ElementsUnderCursor = {
    coords: { x: 0, y: 0 },
    elements: [],
    get topElement() {
      return this.elements.at(-1);
    },
  };

  let hoveredElement: DeepReadonly<CanvasElement> | undefined;

  const refreshHoveredElement = (
    newHoveredElement: DeepReadonly<CanvasElement> | undefined,
  ) => {
    if (hoveredElement?.id === newHoveredElement?.id) return;
    const previous = hoveredElement;
    hoveredElement = newHoveredElement;
    events.emit('onHoveredElementChange', newHoveredElement, previous);
  };

  const refresh = () => {
    const coords = cursorCoordinates.value;
    const elements = aggregator.getCanvasElementsAtCoordinate(coords);

    const changed =
      coords.x !== elementsUnderCursor.coords.x ||
      coords.y !== elementsUnderCursor.coords.y ||
      !sameElements(elementsUnderCursor.elements, elements);

    elementsUnderCursor.coords = coords;
    elementsUnderCursor.elements = elements;

    if (!changed) return;
    events.emit('onElementsUnderCursorChange', elementsUnderCursor);
    refreshHoveredElement(elementsUnderCursor.topElement);
  };

  // on the aggregator's own frame, so what is reported is the canvas as drawn
  aggregator.events.subscribe('onDraw', refresh);

  emitElementMouseEvents({
    emit: events.emit,
    aggregator,
    toWorldCoordinates,
    canvasEvents,
    domEvents,
  });

  return { events, elementsUnderCursor };
};
