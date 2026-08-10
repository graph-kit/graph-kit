import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { Section, SetDefinition, SetDefinitionId } from '../../types.ts';
import type { CircleFocusControls } from '../composables/useCircleFocus.ts';
import type { SectionKey } from '../other/sectionKey.ts';
import {
  drawCircleBackground,
  drawCircleLabel,
  drawCircleOutline,
} from './circles.ts';
import { hatchPattern } from './hatchPattern.ts';
import { colorOverlappingAreas } from './overlaps.ts';

type DrawProps = {
  definitions: SetDefinition[];
  overlaps: Section[];
  highlightedSets: Map<SetDefinitionId, string[]>;
  highlightedOverlaps: Map<SectionKey, string[]>;
  isSetFocused: CircleFocusControls['isSetFocused'];
  backgroundColors: string[] | null;
};

export const draw = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
  const { highlightedSets, highlightedOverlaps } = props;

  if (props.backgroundColors && props.backgroundColors.length > 1) {
    const start = getWorldCoordinates({ clientX: 0, clientY: 0 }, ctx);
    const end = getWorldCoordinates(
      { clientX: window.innerWidth, clientY: window.innerHeight },
      ctx,
    );
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = hatchPattern(ctx, props.backgroundColors);
    ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.restore();
  }

  for (const set of props.definitions) {
    drawCircleBackground(ctx, {
      set,
      highlightColors: highlightedSets.get(set.id) ?? null,
    });
  }

  colorOverlappingAreas(ctx, {
    definitions: props.definitions,
    overlaps: props.overlaps,
    highlightedSets,
    highlightedOverlaps,
  });

  for (const set of props.definitions) {
    const options = {
      set,
      isFocused: props.isSetFocused(set.id),
    };
    drawCircleOutline(ctx, options);
    drawCircleLabel(ctx, options);
  }
};
