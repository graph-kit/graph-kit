import { crossPattern } from '@canvas/surface/crossPattern';
import type { CanvasSurface } from '@canvas/surface/types';

import type { SetsTheme } from './useSetsTheme.ts';

/**
 * paints the canvas element itself: the background behind the aggregator and the
 * cross pattern over it. both resolve per frame, so a preset swap just shows up
 */
export const useCanvasAppearance = (
  surface: CanvasSurface,
  theme: SetsTheme,
) => {
  surface.draw.backgroundPattern.value = crossPattern((alpha) =>
    theme._resolveToken('canvas.patternColor', alpha),
  );

  surface.aggregator.events.subscribe('onDraw', () => {
    const canvas = surface.canvas.value;
    if (!canvas) return;
    canvas.style.backgroundColor = theme._resolveToken('canvas.color');
  });
};
