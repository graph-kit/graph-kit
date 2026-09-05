import type { CanvasSurface } from '@canvas/surface/types';
import { CURSOR } from '@core/utils/cursor';

import { onBeforeUnmount } from 'vue';

import { INPUT_HANDLER_ID } from '../constants.ts';
import { setElementIdentity } from '../draw/elementIdentity.ts';
import type { SetDefinitions } from '../setDefinitions.ts';
import type { SetsTheme } from '../theme/useSetsTheme.ts';
import type { SetDefinitionId } from '../types.ts';
import { useDrag } from './useDrag.ts';

const DRAG_THEME_LAYER_ID = 'sets/useCircleDrag';

type CircleDragProps = {
  surface: CanvasSurface;
  sets: SetDefinitions;
  theme: SetsTheme;
};

export const useCircleDrag = ({ surface, sets, theme }: CircleDragProps) => {
  const drag = useDrag<SetDefinitionId>({
    surface,
    handlerId: INPUT_HANDLER_ID.circleDrag,

    getItem: ({ topElement }) => {
      const identity = setElementIdentity(topElement);
      if (identity?.part !== 'body') return;
      if (!sets.hasDefinition(identity.setId)) return;
      return identity.setId;
    },

    onMove: (setId, { diff }) => sets.moveDefinition(setId, diff),
  });

  const cursorLayer = theme.createLayer(DRAG_THEME_LAYER_ID);
  cursorLayer.set('canvas.cursor', () =>
    drag.isDragging.value ? CURSOR.GRABBING : undefined,
  );

  onBeforeUnmount(() => cursorLayer.removeAll());

  return drag;
};
