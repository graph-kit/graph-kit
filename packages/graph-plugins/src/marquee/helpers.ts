import type { BoundingBox } from '@canvas/primitives/types/utility';
import { PluginOptions } from '@graph/plugins-shared/plugins';

import { MarqueePlugin } from './types.ts';

export function getSurfaceArea(box: BoundingBox) {
  const { width, height } = box;
  return Math.abs(width * height);
}

export const getSelectionBox = (
  controls: PluginOptions<MarqueePlugin>['controls'],
): BoundingBox => {
  const selectionBox = {
    at: { x: Infinity, y: Infinity },
    width: 0,
    height: 0,
  };

  const focusedNodes = controls.focus.focusedNodes();
  if (focusedNodes.length < 2) return selectionBox;

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const node of focusedNodes) {
    const nodeRadius = controls.surface.theme._resolveToken(
      'node.default.size',
      node,
    );
    const nodeBorderWidth = controls.surface.theme._resolveToken(
      'node.default.border.width',
      node,
    );
    const nodeArea = nodeRadius + nodeBorderWidth / 2;
    const { x, y } = controls.positions.presented.get(node.id);

    minX = Math.min(minX, x - nodeArea);
    minY = Math.min(minY, y - nodeArea);
    maxX = Math.max(maxX, x + nodeArea);
    maxY = Math.max(maxY, y + nodeArea);
  }

  if (
    minX < Infinity &&
    minY < Infinity &&
    maxX > -Infinity &&
    maxY > -Infinity
  ) {
    selectionBox.at.x = minX;
    selectionBox.at.y = minY;
    selectionBox.width = maxX - minX;
    selectionBox.height = maxY - minY;
  } else {
    selectionBox.width = 0;
    selectionBox.height = 0;
  }

  return selectionBox;
};
