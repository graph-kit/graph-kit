import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { Section, SetDefinition } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';
import type { SetFocusControls } from '../composables/useSetFocus.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import {
  drawCircleBackground,
  drawCircleLabel,
  drawCircleOutline,
} from './circles.ts';
import { colorAllSections } from './colorAllSections.ts';
import { hatchPattern } from './hatchPattern.ts';

type DrawProps = {
  /** every set to draw, as a circle with its label */
  definitions: SetDefinition[];
  /** every section two or more circles share, back to front so nested ones paint on top */
  overlaps: Section[];
  /** colors painted over a section, keyed by the sets forming it */
  highlightedSections: Map<SectionKey, string[]>;
  /** whether a set carries the focus outline, see {@link SetFocusControls} */
  isSetFocused: SetFocusControls['isFocused'];
  /** colors painted over the region no set covers, drawn behind every circle */
  highlightedOutside: string[];
};

export const draw = (
  ctx: CanvasRenderingContext2D,
  props: DrawProps,
  colors: SetColors,
) => {
  const { highlightedSections } = props;

  if (props.highlightedOutside.length > 0) {
    const start = getWorldCoordinates({ clientX: 0, clientY: 0 }, ctx);
    const end = getWorldCoordinates(
      { clientX: window.innerWidth, clientY: window.innerHeight },
      ctx,
    );
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = hatchPattern(ctx, props.highlightedOutside);
    ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y);
    ctx.restore();
  }

  for (const set of props.definitions) {
    drawCircleBackground(
      ctx,
      {
        set,
        highlightColors: highlightedSections.get(getSectionKey([set.id])) ?? null,
      },
      colors,
    );
  }

  colorAllSections(
    ctx,
    {
      definitions: props.definitions,
      overlaps: props.overlaps,
      highlightedSections,
    },
    colors,
  );

  for (const set of props.definitions) {
    const options = {
      set,
      isFocused: props.isSetFocused(set.id),
    };
    drawCircleOutline(ctx, options, colors);
    drawCircleLabel(ctx, options, colors);
  }
};
