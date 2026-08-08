import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { CircleFocusControls } from '../composables/useCircleFocus.ts';
import type { Circle, Overlap } from '../types/types.ts';
import {
  drawCircleBackground,
  drawCircleLabel,
  drawCircleOutline,
} from './circles.ts';
import { getHatchPattern } from './hatchPattern.ts';
import { colorOverlappingAreas } from './overlaps.ts';

type DrawProps = {
  circles: Circle[];
  overlaps: Overlap[];
  highlightedCircles: Map<Circle['label'], string[]>;
  highlightedOverlaps: Map<Overlap['id'], string[]>;
  isCircleFocused: CircleFocusControls['isCircleFocused'];
  backgroundColors: string[] | null;
};

export const draw = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
  const { highlightedCircles, highlightedOverlaps } = props;

  if (props.backgroundColors && props.backgroundColors.length > 1) {
    const start = getWorldCoordinates({ clientX: 0, clientY: 0 }, ctx);
    const end = getWorldCoordinates(
      { clientX: window.innerWidth, clientY: window.innerHeight },
      ctx,
    );
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = getHatchPattern(ctx, props.backgroundColors);
    ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.restore();
  }

  for (const circle of props.circles) {
    drawCircleBackground(ctx, {
      circle,
      highlightColors: highlightedCircles.get(circle.label) ?? null,
    });
  }

  colorOverlappingAreas(ctx, {
    circles: props.circles,
    overlaps: props.overlaps,
    highlightedCircles,
    highlightedOverlaps,
  });

  for (const circle of props.circles) {
    const options = {
      circle,
      isFocused: props.isCircleFocused(circle.label),
    };
    drawCircleOutline(ctx, options);
    drawCircleLabel(ctx, options);
  }
};
