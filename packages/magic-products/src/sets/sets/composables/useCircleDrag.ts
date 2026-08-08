import { circle } from '@canvas/primitives/shapes/circle/index';
import { CanvasProps } from '@canvas/surface/types';

import type { Ref } from 'vue';

import type { Circle } from '../types/types.ts';
import { useDrag } from './useDrag.ts';

type CircleDragProps = {
  surface: CanvasProps;
  circles: Ref<Circle[]>;
  isResizing: Ref<Boolean>;
};

export const useCircleDrag = ({
  surface,
  circles,
  isResizing,
}: CircleDragProps) =>
  useDrag(
    surface,
    (coord) => {
      if (isResizing.value) return;
      return circles.value
        .toSorted((a, b) => a.radius - b.radius)
        .find((c) => circle(c).hitbox(coord));
    },
    (item, diff) => {
      item.at.x = item.at.x + diff.x;
      item.at.y = item.at.y + diff.y;
    },
  );
