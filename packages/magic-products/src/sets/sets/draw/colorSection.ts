import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { Section, SetDefinition, SetDefinitionId } from '../../types.ts';
import { getSetDefinition } from '../other/circleUtils.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import { hatchPattern } from './hatchPattern.ts';

type ColorSectionProps = {
  definitions: SetDefinition[];
  overlap: Section;
  colors: string[];
};

/** clips to `overlap`'s circles and fills the clipped region with a hatch of `colors`. */
export const colorSection = (
  ctx: CanvasRenderingContext2D,
  props: ColorSectionProps,
) => {
  const { overlap, definitions, colors } = props;
  ctx.save();

  for (const setId of overlap) {
    const {
      at: { x, y },
      radius,
    } = getSetDefinition(definitions, setId).display;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.clip();
  }

  ctx.fillStyle = hatchPattern(ctx, colors);
  ctx.imageSmoothingEnabled = false;

  const startingCoords = getWorldCoordinates({ clientX: 0, clientY: 0 }, ctx);
  const endingCoords = getWorldCoordinates(
    { clientX: window.innerWidth, clientY: window.innerHeight },
    ctx,
  );

  ctx.fillRect(
    startingCoords.x,
    startingCoords.y,
    endingCoords.x - startingCoords.x,
    endingCoords.y - startingCoords.y,
  );

  ctx.restore();
};

/**
 * every section that geometrically contains `section`, ie. every proper,
 * non-empty subset of its ids.
 *
 * @example
 * getAncestorSections(['A', 'B', 'C']) // [['A'], ['B'], ['C'], ['A','B'], ['A','C'], ['B','C']]
 */
export const getAncestorSections = (section: Section): Section[] => {
  const ancestorSections: Section[] = [];
  const fullSetMask = 2 ** section.length - 1;

  // each mask from 1 to fullSetMask - 1 selects one ancestor section by its included ids
  for (let mask = 1; mask < fullSetMask; mask++) {
    const ancestorSection = section.filter((_, i) => mask & (1 << i));
    ancestorSections.push(ancestorSection);
  }

  return ancestorSections;
};

const isSectionHighlighted = (
  section: Section,
  highlightedSets: Map<SetDefinitionId, string[]>,
  highlightedOverlaps: Map<SectionKey, string[]>,
) =>
  section.length === 1
    ? highlightedSets.has(section[0])
    : highlightedOverlaps.has(getSectionKey(section));

/**
 * true when `section` sits nested inside a highlighted section, meaning
 * `section` must be redrawn (even just back to its unhighlighted fill) or
 * that ancestor's color would bleed through.
 */
export const hasHighlightedAncestor = (
  section: Section,
  highlightedSets: Map<SetDefinitionId, string[]>,
  highlightedOverlaps: Map<SectionKey, string[]>,
) =>
  getAncestorSections(section).some((ancestor) =>
    isSectionHighlighted(ancestor, highlightedSets, highlightedOverlaps),
  );
