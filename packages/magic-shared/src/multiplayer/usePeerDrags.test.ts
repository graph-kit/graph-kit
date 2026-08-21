import {
  Aggregator,
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';
import { CanvasSurface } from '@canvas/surface/types';
import { createEventHub } from '@core/events/createEventHub';
import { DraggedElement } from '@multiplayer/protocol/room';
import { describe, expect, it } from 'vitest';

import { computed, shallowRef } from 'vue';

import { HostBinding } from '../product/types.ts';
import {
  MultiplayerEventMap,
  createMultiplayerEventRegistry,
} from './events.ts';
import { ProductMultiplayer, RoomState } from './types.ts';
import { usePeerDrags } from './usePeerDrags.ts';

const elementAt = (id: string): DraggedElement => ({
  id,
  position: { x: 0, y: 0 },
});

const setup = (peerDrags: Record<string, DraggedElement[]> = {}) => {
  const events = createEventHub<MultiplayerEventMap>(
    createMultiplayerEventRegistry(),
  );

  const transformers: AggregatorTransformer[] = [];
  const surface = {
    aggregator: { transformers },
  } as unknown as CanvasSurface;

  const applied: string[] = [];
  const ended: string[] = [];
  const binding = shallowRef<HostBinding>({
    applyPeerDrag: (peerId: string, elements: DraggedElement[]) =>
      applied.push(`${peerId}:${elements.map(({ id }) => id).join(',')}`),
    endPeerDrag: (peerId: string) => ended.push(peerId),
  } as unknown as HostBinding);

  const userIdToPresence = Object.fromEntries(
    Object.entries(peerDrags).map(([peerId, drag]) => [
      peerId,
      { cursorPosition: null, cameraState: null, drag, isAnnotating: false },
    ]),
  );

  const multiplayer = {
    events,
    room: {
      state: computed(
        () =>
          ({
            connected: true,
            id: 'room-1',
            userIdToRosterEntry: {},
            userIdToPresence,
            me: { id: 'me', tier: 'write', isHost: false },
          }) as unknown as RoomState,
      ),
    },
  } as unknown as ProductMultiplayer;

  usePeerDrags({ binding, multiplayer, surface });

  /** what the transformer leaves behind, which is what the pointer is tested against */
  const paintOnlyIds = (ids: string[]) => {
    const aggregator: Aggregator = ids.map(
      (id) => ({ id, priority: 1, shape: {} }) as unknown as CanvasElement,
    );
    for (const transform of transformers) transform(aggregator);
    return aggregator.filter(({ paintOnly }) => paintOnly).map(({ id }) => id);
  };

  return { events, applied, ended, paintOnlyIds };
};

describe(usePeerDrags, () => {
  it('holds what a peer picks up', () => {
    const { events, applied, paintOnlyIds } = setup();

    events.emit('onPeerDragStarted', 'peer-1', [elementAt('a')]);

    expect(paintOnlyIds(['a', 'b'])).toEqual(['a']);
    expect(applied).toEqual(['peer-1:a']);
  });

  it('releases on a drop', () => {
    const { events, ended, paintOnlyIds } = setup();

    events.emit('onPeerDragStarted', 'peer-1', [elementAt('a')]);
    events.emit('onPeerDragEnded', 'peer-1');

    expect(paintOnlyIds(['a'])).toEqual([]);
    expect(ended).toEqual(['peer-1']);
  });

  it('releases when a peer leaves the product', () => {
    const { events, ended, paintOnlyIds } = setup();

    events.emit('onPeerDragStarted', 'peer-1', [elementAt('a')]);
    events.emit('onPeerLeftProduct', 'peer-1');

    expect(paintOnlyIds(['a'])).toEqual([]);
    expect(ended).toEqual(['peer-1']);
  });

  it('keeps one peer holding when another lets go', () => {
    const { events, paintOnlyIds } = setup();

    events.emit('onPeerDragStarted', 'peer-1', [elementAt('a')]);
    events.emit('onPeerDragStarted', 'peer-2', [elementAt('b')]);
    events.emit('onPeerDragEnded', 'peer-1');

    expect(paintOnlyIds(['a', 'b'])).toEqual(['b']);
  });

  // the room releases a drag early, then its owner's next move revives it
  it('takes a second start for a peer already holding', () => {
    const { events, paintOnlyIds } = setup();

    events.emit('onPeerDragStarted', 'peer-1', [elementAt('a')]);
    events.emit('onPeerDragEnded', 'peer-1');
    events.emit('onPeerDragStarted', 'peer-1', [elementAt('a')]);

    expect(paintOnlyIds(['a'])).toEqual(['a']);
  });

  it('adopts a drag that was already in flight on arrival', () => {
    const { events, applied, paintOnlyIds } = setup({
      'peer-1': [elementAt('a')],
    });

    events.emit('onPresenceSeeded');

    expect(paintOnlyIds(['a'])).toEqual(['a']);
    expect(applied).toEqual(['peer-1:a']);
  });
});
