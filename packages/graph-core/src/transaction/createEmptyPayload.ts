import { CorePayload } from './types.ts';

export function createEmptyPayload() {
  const payload: CorePayload = {
    addedNodes: [],
    addedEdges: [],

    removedNodeIds: [],
    removedEdgeIds: [],
  };
  return payload;
}
