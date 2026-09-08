import { centerCameraOn } from '@canvas/surface/camera/centerCameraOn';
import { CanvasSurface } from '@canvas/surface/types';

import { Coordinate } from './graph-conversion/getTreeNodePositions.ts';
import { ROOT_POSITION } from './graph-conversion/treeToGraph.ts';

const DEFAULT: Coordinate = { x: 0, y: -250 };

/** puts the tree on screen, optionally offset from the middle of it */
export const centerCameraOnTree = (
  surface: CanvasSurface,
  rootOffset: Coordinate = DEFAULT,
) =>
  centerCameraOn(surface, {
    x: ROOT_POSITION.x - rootOffset.x,
    y: ROOT_POSITION.y - rootOffset.y,
  });
