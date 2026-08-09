import { CanvasProps } from '@canvas/surface/types';
import { createEventHub } from '@graph/primitives/events/createEventHub';
import { MagicProductHost } from '@magic/shared/product';

export const initHost = (surface: CanvasProps): MagicProductHost => ({
  setAppearance: () => {},
  events: createEventHub<{ onStructureChange: () => void }>({
    onStructureChange: new Set(),
  }),
  canvas: {
    surface,
    events: createEventHub<{
      onMouseUp: () => void;
      onMouseDown: () => void;
    }>({
      onMouseUp: new Set(),
      onMouseDown: new Set(),
    }),
  },
  transit: {
    encode: () => {},
    decode: () => {},
  },
});
