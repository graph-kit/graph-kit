import { nullThrows } from '@core/utils/assert';
import { IS_DEV, devWarning } from '@core/utils/debugging';
import { getValue } from '@core/utils/maybeGetter/index';
import { EventHub } from '@graph/primitives/events/createEventHub';

import { CoreEventMap } from '../events.ts';
import { DEFAULT_POSITION } from './constants.ts';
import {
  NodePositionStoreControls,
  NodePositionStreamControls,
  NodePositionUpdate,
  Position,
} from './types.ts';

export const createNodePositionStore = (
  events: EventHub<CoreEventMap>,
): NodePositionStoreControls => {
  // setMany mutates the stored Position in place, so a reactiveMap would miss every
  // move and nothing may derive from positions
  const nodeIdToNodePosition = new Map<string, Position>();

  const getNodePosition: NodePositionStoreControls['get'] = (nodeId) =>
    nullThrows(
      nodeIdToNodePosition.get(nodeId),
      `could not resolve position from node with id ${nodeId}`,
    );

  /**
   * A node can leave the graph while a bulk write is in flight, so those writes skip
   * whatever is already gone. Only a targeted `set` treats a missing node as a fault.
   */
  const stillPositioned = (positions: NodePositionUpdate[]) =>
    positions.filter(({ nodeId }) => nodeIdToNodePosition.has(nodeId));

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

  const devStreamRegistry = IS_DEV
    ? new FinalizationRegistry<void>(() => {
        devWarning(
          'A node position stream was garbage collected without stop() being called. Make sure to call stop() when the stream is done.',
        );
      })
    : undefined;

  const createStream: NodePositionStoreControls['createStream'] = () => {
    let stopped = false;
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
        const entries = setNodePositions(stillPositioned(positions));
        for (const { nodeId } of entries) touchedNodeIds.add(nodeId);
        events.emit('onNodeMoveStream', entries);
        return entries;
      },
      stop: () => {
        if (stopped) return [];
        stopped = true;
        devStreamRegistry?.unregister(unregisterToken);
        // nodes moved earlier in the stream may have been deleted since, so only the
        // ones still in the graph get committed
        const committed = [...touchedNodeIds]
          .filter((nodeId) => nodeIdToNodePosition.has(nodeId))
          .map((nodeId) => ({
            nodeId,
            position: { ...getNodePosition(nodeId) },
          }));
        if (committed.length > 0) {
          events.emit('onNodePositionsCommitted', committed);
        }
        events.emit('onNodeMoveStreamEnd');
        return committed;
      },
    };
    devStreamRegistry?.register(stream, undefined, unregisterToken);
    return stream;
  };

  return {
    get: getNodePosition,
    set: (position) => {
      const [entry] = setNodePositions([position]);
      events.emit('onNodePositionsCommitted', [entry]);
      return entry;
    },
    setMany: (positions) => {
      const entries = setNodePositions(stillPositioned(positions));
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
