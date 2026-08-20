import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import type { EventHub, ReadonlyEventHub } from '@core/events/createEventHub';
import type { EventMapToEventRegistry } from '@core/events/types';
import type { Coordinate } from '@core/utils/canvas/index';
import { DeepReadonly } from 'ts-essentials';

import type { CanvasBoundEvents } from './canvas.ts';
import type { DocumentBoundEvents } from './dom.ts';
import type { ElementEvents, ElementsUnderCursor } from './elements.ts';

/** a native mouse event resolved against whatever was drawn where it landed */
export type ElementMouseEvent = DeepReadonly<ElementsUnderCursor> & {
  event: MouseEvent;
};

export type ElementMouseEventMap = {
  onClick: (ev: ElementMouseEvent) => void;
  onMouseDown: (ev: ElementMouseEvent) => void;
  onMouseUp: (ev: ElementMouseEvent) => void;
  onMouseMove: (ev: ElementMouseEvent) => void;
  onDblClick: (ev: ElementMouseEvent) => void;
  onContextMenu: (ev: ElementMouseEvent) => void;
};

export const createElementMouseEventRegistry =
  (): EventMapToEventRegistry<ElementMouseEventMap> => ({
    onClick: new Set(),
    onMouseDown: new Set(),
    onMouseUp: new Set(),
    onMouseMove: new Set(),
    onDblClick: new Set(),
    onContextMenu: new Set(),
  });

type EmitElementMouseEventsOptions = {
  emit: EventHub<ElementEvents>['emit'];
  aggregator: Pick<AggregatorControls, 'getCanvasElementsAtCoordinate'>;
  toWorldCoordinates: (ev: MouseEvent) => Coordinate;
  canvasEvents: Pick<ReadonlyEventHub<CanvasBoundEvents>, 'subscribe'>;
  domEvents: Pick<ReadonlyEventHub<DocumentBoundEvents>, 'subscribe'>;
};

export const emitElementMouseEvents = ({
  emit,
  aggregator,
  toWorldCoordinates,
  canvasEvents,
  domEvents,
}: EmitElementMouseEventsOptions) => {
  const elementMouseEvent = (event: MouseEvent): ElementMouseEvent => {
    const coords = toWorldCoordinates(event);
    const elements = aggregator.getCanvasElementsAtCoordinate(coords);

    return { coords, elements, topElement: elements.at(-1), event };
  };

  canvasEvents.subscribe('onClick', (ev) =>
    emit('onClick', elementMouseEvent(ev)),
  );
  canvasEvents.subscribe('onMouseDown', (ev) =>
    emit('onMouseDown', elementMouseEvent(ev)),
  );
  canvasEvents.subscribe('onMouseMove', (ev) =>
    emit('onMouseMove', elementMouseEvent(ev)),
  );
  canvasEvents.subscribe('onDblClick', (ev) =>
    emit('onDblClick', elementMouseEvent(ev)),
  );
  canvasEvents.subscribe('onContextMenu', (ev) =>
    emit('onContextMenu', elementMouseEvent(ev)),
  );

  // mouseup is bound to the document, so a drag that ends off canvas still finishes
  domEvents.subscribe('onMouseUp', (ev) =>
    emit('onMouseUp', elementMouseEvent(ev)),
  );
};
