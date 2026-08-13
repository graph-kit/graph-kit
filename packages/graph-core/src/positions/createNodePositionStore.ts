import { nullThrows } from '@core/utils/assert';
import { getValue } from '@core/utils/maybeGetter/index';
import { EventHub } from '@graph/primitives/events/createEventHub';

import { CoreEventMap } from '../events.ts';
import { DEFAULT_POSITION } from './constants.ts';
import {
  NodePositionStoreControls,
  NodePositionStreamControls,
  Position,
} from './types.ts';

export const createNodePositionStore = (
  events: EventHub<CoreEventMap>,
): NodePositionStoreControls => {
  // plain Map is safe only while nothing derives from positions, since setMany mutates
  // the stored Position in place and a reactiveMap would never see the write.
  const nodeIdToNodePosition = new Map<string, Position>();

  const getNodePosition: NodePositionStoreControls['get'] = (nodeId) =>
    nullThrows(
      nodeIdToNodePosition.get(nodeId),
      `could not resolve position from node with id ${nodeId}`,
    );

  const setNodePositions: NodePositionStoreControls['setMany'] = (
    positions,
  ) => {
    return positions.map(({ nodeId, update }) => {
      const currentPosition = getNodePosition(nodeId);
      const position = getValue(update, currentPosition);
      currentPosition.x = position.x ?? currentPosition.x;
      currentPosition.y = position.y ?? currentPosition.y;
      currentPosition.z = position.z ?? currentPosition.z;
      return { nodeId, position: { ...currentPosition } };
    });
  };

  let activeStream = false;

  const devStreamRegistry = new FinalizationRegistry<void>(() => {
    console.warn(
      'A node position stream was garbage collected without stop() being called. Make sure to call stop() when the stream is done.',
    );
    activeStream = false;
  });

  const createStream: NodePositionStoreControls['createStream'] = () => {
    if (activeStream) {
      throw new Error(
        'A node position stream is already active. Call stop() before creating a new stream.',
      );
    }
    activeStream = true;
    events.emit('onNodeMoveStreamStart');
    const touchedNodeIds = new Set<string>();
    const unregisterToken = {};
    const stream: NodePositionStreamControls = {
      set: (position) => {
        const [entry] = setNodePositions([position]);
        touchedNodeIds.add(entry.nodeId);
        events.emit('onNodeMoveStream', [entry]);
        return entry;
      },
      setMany: (positions) => {
        const entries = setNodePositions(positions);
        for (const { nodeId } of entries) touchedNodeIds.add(nodeId);
        events.emit('onNodeMoveStream', entries);
        return entries;
      },
      stop: () => {
        if (!activeStream) return [];
        activeStream = false;
        devStreamRegistry?.unregister(unregisterToken);
        const committed = [...touchedNodeIds].map((nodeId) => ({
          nodeId,
          position: { ...getNodePosition(nodeId) },
        }));
        events.emit('onNodePositionsCommitted', committed);
        events.emit('onNodeMoveStreamEnd');
        return committed;
      },
    };
    devStreamRegistry?.register(stream, undefined, unregisterToken);
    return stream;
  };

  const assertNoActiveStream = () => {
    if (activeStream) {
      throw new Error(
        'Cannot write to the position store while a stream is active. Call stop() on the active stream first.',
      );
    }
  };

  return {
    get: getNodePosition,
    set: (position) => {
      assertNoActiveStream();
      const [entry] = setNodePositions([position]);
      events.emit('onNodePositionsCommitted', [entry]);
      return entry;
    },
    setMany: (positions) => {
      assertNoActiveStream();
      const entries = setNodePositions(positions);
      events.emit('onNodePositionsCommitted', entries);
      return entries;
    },
    createStream,
    _internal: {
      nodeIdToNodePosition,
      add: (nodePositions) => {
        for (const { id, position } of nodePositions) {
          nodeIdToNodePosition.set(id, {
            ...DEFAULT_POSITION,
            ...position,
          });
        }
      },
      remove: (nodeIds) => {
        for (const id of nodeIds) {
          nodeIdToNodePosition.delete(id);
        }
      },
    },
  };
};
