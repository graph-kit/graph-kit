import type { Circle, Overlap } from '../../types.ts';
import type { CircleFocusControls } from '../composables/useCircleFocus.ts';
import {
  drawCircleBackground,
  drawCircleLabel,
  drawCircleOutline,
} from './circles.ts';
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
