import type { BoundingBox } from '@core/utils/canvas/index';

import type { Section, SetDefinition } from '../../types.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import { hatchPattern } from './hatchPattern.ts';

type ColorSectionsProps = {
  definitions: SetDefinition[];
  sections: Section[];
  /** colors painted over a section, keyed by the sets forming it */
  sectionKeyToColors: Map<SectionKey, string[]>;
  /** the area to paint within, which every clip is taken against */
  bounds: BoundingBox;
};

const clipInsideCircle = (
  ctx: CanvasRenderingContext2D,
  { display }: SetDefinition,
) => {
  ctx.beginPath();
  ctx.arc(display.at.x, display.at.y, display.radius, 0, 2 * Math.PI);
  ctx.clip();
};

const clipOutsideCircle = (
  ctx: CanvasRenderingContext2D,
  { display }: SetDefinition,
  rect: BoundingBox,
) => {
  const { at, radius } = display;
  // the circle punches a hole in the visible world under the even odd rule
  const path = new Path2D();
  path.rect(rect.at.x, rect.at.y, rect.width, rect.height);
  path.moveTo(at.x + radius, at.y);
  path.arc(at.x, at.y, radius, 0, 2 * Math.PI);
  ctx.clip(path, 'evenodd');
};

type ColorSectionOptions = {
  ctx: CanvasRenderingContext2D;
  definitions: SetDefinition[];
  section: Section;
  colors: string[];
  /** the area to paint within, which every clip is taken against */
  bounds: BoundingBox;
};

/**
 * fills exactly the region `section` covers, inside every set forming it and
 * outside every other set, with a hatch of `colors`. clips compose by
 * intersection, so the region comes out atomic no matter what order sections
 * are painted in
 */
const colorSection = (options: ColorSectionOptions) => {
  const { ctx, definitions, section, colors, bounds } = options;

  ctx.save();

  for (const definition of definitions) {
    if (section.includes(definition.id)) clipInsideCircle(ctx, definition);
    else clipOutsideCircle(ctx, definition, bounds);
  }

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = hatchPattern(ctx, colors);
  ctx.fillRect(bounds.at.x, bounds.at.y, bounds.width, bounds.height);

  ctx.restore();
};

/**
 * paints every highlighted section. a section with no highlight is left alone,
 * so the canvas shows through wherever nothing selects it
 */
export const colorSections = (
  ctx: CanvasRenderingContext2D,
  props: ColorSectionsProps,
) => {
  const { sections, definitions, sectionKeyToColors, bounds } = props;

  for (const section of sections) {
    const colors = sectionKeyToColors.get(getSectionKey(section));
    if (!colors) continue;
    colorSection({ ctx, definitions, section, colors, bounds });
  }
};
