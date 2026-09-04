import type { CanvasSurface } from '@canvas/surface/types';
import { CURSOR } from '@core/utils/cursor';

import { type Ref, onBeforeUnmount } from 'vue';

import { setElementIdentity } from '../draw/elementIdentity.ts';
import type { SetsTheme } from '../theme/useSetsTheme.ts';
import type { SetDefinition } from '../types.ts';
import { useDrag } from './useDrag.ts';

const DRAG_THEME_LAYER_ID = 'sets/useCircleDrag';

type CircleDragProps = {
  surface: CanvasSurface;
  definitions: Ref<SetDefinition[]>;
  theme: SetsTheme;
};

export const useCircleDrag = ({
  surface,
  definitions,
  theme,
}: CircleDragProps) => {
  const drag = useDrag(
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

  const cursorLayer = theme.createLayer(DRAG_THEME_LAYER_ID);
  cursorLayer.set('canvas.cursor', () =>
    drag.isDragging.value ? CURSOR.GRABBING : undefined,
  );

  onBeforeUnmount(() => cursorLayer.removeAll());

  return drag;
};
