import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { Camera } from './camera/index.ts';
import type { Coordinate, DrawFns } from './types.ts';

const STAGGER = 100;

const START_PATTERN_FADE_OUT = 0.6;
const PATTERN_FULLY_FADED_OUT = 0.25;

const computeAlpha = (z: number) => {
  if (z <= PATTERN_FULLY_FADED_OUT) return '00';
  if (z >= START_PATTERN_FADE_OUT) return '';
  const strPercent = String(
    Math.floor(
      ((z - PATTERN_FULLY_FADED_OUT) /
        (START_PATTERN_FADE_OUT - PATTERN_FULLY_FADED_OUT)) *
        100,
    ),
  );
  return strPercent.length === 1 ? `0${strPercent}` : strPercent;
};

/**
 * Prepares the pattern for a frame and returns how to stamp a single cell of it.
 *
 * Two stages because position is the only thing that differs between cells, and
 * at low zoom there are a few thousand of them. The outer call is where an
 * implementation builds its shapes and resolves its color, once, and the
 * returned function is the only thing the frame runs per cell.
 */
export type DrawPattern = (
  ctx: CanvasRenderingContext2D,
  alpha: string,
) => (at: Coordinate) => void;

export const useBackgroundPattern = (
  { panX, panY, zoom }: Camera['state'],
  drawPattern: DrawFns['backgroundPattern'],
) => {
  /**
   * @param canvasRect the canvas's on screen position, passed in rather than
   * measured here: both corners below need it, and reading it forces layout
   */
  const draw = (
    ctx: CanvasRenderingContext2D,
    canvasRect: Pick<DOMRect, 'left' | 'top'>,
  ) => {
    if (zoom.value <= PATTERN_FULLY_FADED_OUT) return;

    const startingCoords = getWorldCoordinates(
      {
        clientX: 0,
        clientY: 0,
      },
      ctx,
      canvasRect,
    );

    const endingCoords = getWorldCoordinates(
      {
        clientX: window.innerWidth + STAGGER,
        clientY: window.innerHeight + STAGGER,
      },
      ctx,
      canvasRect,
    );

    const offsetX = (panX.value / zoom.value) % STAGGER;
    const offsetY = (panY.value / zoom.value) % STAGGER;

    // the alpha follows zoom alone, so it is the same string for every cell
    const drawCell = drawPattern.value(ctx, computeAlpha(zoom.value));

    for (let x = startingCoords.x + offsetX; x < endingCoords.x; x += STAGGER) {
      for (
        let y = startingCoords.y + offsetY;
        y < endingCoords.y;
        y += STAGGER
      ) {
        drawCell({ x, y });
      }
    }
  };

  return { draw };
};
