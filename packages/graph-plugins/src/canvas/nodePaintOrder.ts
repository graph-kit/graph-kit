/**
 * Which nodes this client has hovered, most recent last.
 *
 * Deliberately not in the position store: paint order is a function of where one user's
 * cursor has been, so writing it there would make every hover a committed position that
 * gets persisted, broadcast, and reorders everyone else's canvas.
 */
export type NodePaintOrder = {
  /** puts a node in front of every other, which is what a hover does */
  promote: (nodeId: string) => void;
  /** ordinal, ascending, where a node nobody has hovered sits behind every one that was */
  of: (nodeId: string) => number;
};

const NEVER_HOVERED = -1;

export const createNodePaintOrder = (): NodePaintOrder => {
  const nodeIdToOrder = new Map<string, number>();
  // monotonic rather than a closed rotation, since rotation means redistributing across
  // every node and breaks the moment one arrives with a colliding default
  let promotions = 0;

  return {
    promote: (nodeId) => {
      nodeIdToOrder.set(nodeId, promotions++);
    },
    of: (nodeId) => nodeIdToOrder.get(nodeId) ?? NEVER_HOVERED,
  };
};
