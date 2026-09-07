import { createEventHub } from '@core/events/createEventHub';
import type { ReadonlyEventHub } from '@core/events/createEventHub';
import type { DragEventMap } from '@magic/shared/product';
import type { DraggedElement } from '@multiplayer/protocol/room';

import { resizeBandElementId } from '../../draw/elementIdentity.ts';
import type { SetDefinitions } from '../../setDefinitions.ts';
import type { SetGestures } from '../../setGestures.ts';
import type { SetDefinitionId } from '../../types.ts';

type TrackDraggedSetsParts = {
  sets: SetDefinitions;
  gestures: SetGestures;
};

/**
 * Turns the circle gestures into the three moments the room cares about.
 *
 * Driven by the gesture rather than by the store, which is load bearing: a peer's drag
 * is applied through the same store, so reading it there would send their move back out
 * as this user's own.
 */
export const trackDraggedSets = ({
  sets,
  gestures,
}: TrackDraggedSetsParts): ReadonlyEventHub<DragEventMap> => {
  const events = createEventHub<DragEventMap>({
    onDragStarted: new Set(),
    onDragMoved: new Set(),
    onDragEnded: new Set(),
  });

  /*
    a set is two canvas elements, the circle and the resize band sitting above it, and the
    room marks what a peer is holding by exact element id. naming only the circle would
    leave the band grabbable, so the other user could resize a circle out from under
    somebody already dragging it
  */
  const elementsFor = (setId: SetDefinitionId): DraggedElement[] => {
    if (!sets.hasDefinition(setId)) return [];
    const { at } = sets.getDefinition(setId).display;
    const position = { x: at.x, y: at.y };
    return [
      { id: setId, position },
      { id: resizeBandElementId(setId), position },
    ];
  };

  gestures.events.subscribe('onGestureStarted', (setId) =>
    events.emit('onDragStarted', elementsFor(setId)),
  );

  gestures.events.subscribe('onGestureEnded', () => events.emit('onDragEnded'));

  /*
    the store reports every frame of every move, this user's and a peer's alike. filtering
    to what a local gesture is holding is what keeps a peer's drag from going back out,
    and it is exact: a peer's move only ever lands on a set nobody here has hold of
  */
  sets.events.subscribe('onDisplayChanged', (setIds) => {
    const held = setIds.filter(gestures.isHolding);
    if (held.length === 0) return;
    events.emit('onDragMoved', held.flatMap(elementsFor));
  });

  return events;
};
