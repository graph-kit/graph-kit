import { circle } from '@canvas/primitives/shapes/circle/index';
import { CanvasSurface } from '@canvas/surface/types';

import type { Ref } from 'vue';

import type { SetDefinition } from '../../types.ts';
import { useDrag } from './useDrag.ts';

type CircleDragProps = {
  surface: CanvasSurface;
  definitions: Ref<SetDefinition[]>;
  isResizing: Ref<boolean>;
};

export const useCircleDrag = ({
  surface,
  definitions,
  isResizing,
}: CircleDragProps) =>
  useDrag(
    surface,
    (coord) => {
      if (isResizing.value) return;
      return definitions.value
        .toSorted((a, b) => a.display.radius - b.display.radius)
        .find(({ display }) => circle(display).hitbox(coord));
    },
    (definition, diff) => {
      const { at } = definition.display;
      at.x += diff.x;
      at.y += diff.y;
    },
  );
