import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { Section, SetDefinition, SetDefinitionId } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';
import { getSetDefinition } from '../other/circleUtils.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import { hatchPattern } from './hatchPattern.ts';

type DrawOverlappingAreaProps = {
  definitions: SetDefinition[];
  overlap: Section;
  colors: string[];
};

const colorSection = (
  ctx: CanvasRenderingContext2D,
  props: DrawOverlappingAreaProps,
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

type ColorSections = {
  definitions: SetDefinition[];
  overlaps: Section[];
  highlightedSets: Map<SetDefinitionId, string[]>;
  highlightedOverlaps: Map<SectionKey, string[]>;
};

const getProperNonEmptySubsets = (section: Section): Section[] => {
  const sections: Section[] = [];
  const fullSetMask = 2 ** section.length - 1;

  // Each mask from 1 to fullSetMask - 1 represents one proper, non-empty subset,
  // where bit i indicates whether setIds[i] is included.
  for (let mask = 1; mask < fullSetMask; mask++) {
    const subset = section.filter((_, i) => mask & (1 << i));
    sections.push(subset);
  }

  return sections;
};

export const colorSections = (
  ctx: CanvasRenderingContext2D,
  props: ColorSections,
  colors: SetColors,
) => {
  const { definitions, overlaps, highlightedSets, highlightedOverlaps } = props;

  // a highlighted ancestor means this section's fill would bleed through and must be redrawn
  const isHighlighted = (section: Section) =>
    section.length === 1
      ? highlightedSets.has(section[0])
      : highlightedOverlaps.has(getSectionKey(section));

  const hasHighlightedAncestor = (section: Section) =>
    getProperNonEmptySubsets(section).some(isHighlighted);

  for (const overlap of overlaps) {
    const highlightColors = highlightedOverlaps.get(getSectionKey(overlap));
    if (!highlightColors && !hasHighlightedAncestor(overlap)) continue;
    colorSection(ctx, {
      definitions,
      overlap,
      colors: highlightColors ?? [colors.unhighlighted],
    });
  }
};
