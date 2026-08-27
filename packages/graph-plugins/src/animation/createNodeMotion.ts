import { EASING_PRESETS } from '@canvas/primitives/animation/easing';
import { Position } from '@graph/primitives/types';

export type NodeMove = {
  nodeId: string;
  from: Position;
  to: Position;
};

type PositionTween = NodeMove & {
  startedAt: number;
  durationMs: number;
};

type MotionStream = {
  setMany: (
    positions: { nodeId: string; update: Partial<Position> }[],
  ) => unknown;
  cancel: () => void;
};

type MotionPositions = {
  get: (nodeId: string) => Position;
  presented: { get: (nodeId: string) => Position };
  createStream: () => MotionStream;
};

export type NodeMotionOptions = {
  positions: MotionPositions;
  nodeIds: () => string[];
  hasNode: (nodeId: string) => boolean;
};

const samePosition = (previous: Position, next: Position) =>
  previous.x === next.x && previous.y === next.y && previous.z === next.z;

const at = (tween: PositionTween, eased: number): Position => ({
  x: tween.from.x + (tween.to.x - tween.from.x) * eased,
  y: tween.from.y + (tween.to.y - tween.from.y) * eased,
  z: tween.from.z + (tween.to.z - tween.from.z) * eased,
});

export const createNodeMotion = ({
  positions,
  nodeIds,
  hasNode,
}: NodeMotionOptions) => {
  const easing = EASING_PRESETS['in-out'];
  const tweens = new Map<string, PositionTween>();

  let stream: MotionStream | undefined;
  let tweenFrame: number | undefined;

  // the mutation already committed where these nodes belong, so the stream is
  // cancelled rather than stopped: its job was only to present the catch up
  const release = () => {
    tweenFrame = undefined;
    tweens.clear();
    stream?.cancel();
    stream = undefined;
  };

  const step = (now: number) => {
    const updates: { nodeId: string; update: Partial<Position> }[] = [];

    for (const [nodeId, tween] of [...tweens]) {
      const progress =
        tween.durationMs <= 0
          ? 1
          : Math.min((now - tween.startedAt) / tween.durationMs, 1);

      if (progress >= 1) {
        tweens.delete(nodeId);
        continue;
      }

      updates.push({ nodeId, update: at(tween, easing(progress)) });
    }

    if (tweens.size === 0) {
      release();
      return;
    }

    stream?.setMany(updates);
    tweenFrame = requestAnimationFrame(step);
  };

  return {
    snapshot: () => {
      const positionByNodeId = new Map<string, Position>();
      for (const nodeId of nodeIds()) {
        positionByNodeId.set(nodeId, { ...positions.presented.get(nodeId) });
      }
      return positionByNodeId;
    },

    collect: (before: Map<string, Position>) => {
      const moves: NodeMove[] = [];

      for (const [nodeId, from] of before) {
        if (!hasNode(nodeId)) continue;

        const committed = positions.get(nodeId);
        if (samePosition(from, committed)) continue;

        moves.push({ nodeId, from, to: { ...committed } });
      }

      return moves;
    },

    start: (moves: NodeMove[], durationMs: number) => {
      if (moves.length === 0) return;

      const startedAt = performance.now();
      for (const move of moves) {
        tweens.set(move.nodeId, { ...move, startedAt, durationMs });
      }

      stream ??= positions.createStream();
      stream.setMany(
        moves.map(({ nodeId, from }) => ({ nodeId, update: from })),
      );

      tweenFrame ??= requestAnimationFrame(step);
    },

    cancelAll: () => {
      if (tweenFrame !== undefined) cancelAnimationFrame(tweenFrame);
      release();
    },

    isMoving: (nodeId: string) => tweens.has(nodeId),
  };
};
