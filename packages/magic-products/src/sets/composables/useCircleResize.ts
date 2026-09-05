import type { CanvasSurface } from '@canvas/surface/types';

import { INPUT_HANDLER_ID } from '../constants.ts';
import { setElementIdentity } from '../draw/elementIdentity.ts';
import type { SetDefinitions } from '../setDefinitions.ts';
import type { SetGestures } from '../setGestures.ts';
import type { SetDefinitionId } from '../types.ts';
import { useDrag } from './useDrag.ts';

type CircleResizeProps = {
  surface: CanvasSurface;
  sets: SetDefinitions;
  gestures: SetGestures;
  /** true while the room has this user on the read tier */
  isReadonly: () => boolean;
};

export const useCircleResize = ({
  surface,
  sets,
  gestures,
  isReadonly,
}: CircleResizeProps) => {
  const { isDragging: isResizing } = useDrag<SetDefinitionId>({
    surface,
    handlerId: INPUT_HANDLER_ID.circleResize,

    getItem: ({ topElement }) => {
      if (isReadonly()) return;
      const identity = setElementIdentity(topElement);
      if (identity?.part !== 'edge') return;
      if (!sets.hasDefinition(identity.setId)) return;

      gestures.report.held(identity.setId);
      return identity.setId;
    },

    onMove: (setId, { at: coords }) => {
      if (!sets.hasDefinition(setId)) return;
      const { at } = sets.getDefinition(setId).display;
      sets.resizeDefinition(
        setId,
        Math.hypot(at.x - coords.x, at.y - coords.y),
      );
    },

    onDrop: (setId) => gestures.report.released(setId),
  });

  return {
    isResizing,
  };
};
