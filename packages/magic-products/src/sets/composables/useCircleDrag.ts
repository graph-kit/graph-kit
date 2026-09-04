import type { CanvasSurface } from '@canvas/surface/types';

import type { Ref } from 'vue';

import { setElementIdentity } from '../draw/elementIdentity.ts';
import type { SetDefinition } from '../types.ts';
import { useDrag } from './useDrag.ts';

type CircleDragProps = {
  surface: CanvasSurface;
  definitions: Ref<SetDefinition[]>;
};

export const useCircleDrag = ({ surface, definitions }: CircleDragProps) =>
  useDrag(
    surface,
    ({ topElement }) => {
      // the resize band sits above the circle, so landing on the edge is not a drag
      const identity = setElementIdentity(topElement);
      if (identity?.part !== 'body') return;
      return definitions.value.find(({ id }) => id === identity.setId);
    },
    (definition, diff) => {
      const { at } = definition.display;
      at.x += diff.x;
      at.y += diff.y;
    },
  );
