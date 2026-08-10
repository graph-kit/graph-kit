import { getWorldCoordinates } from '@core/utils/canvas/index';

import type { Section, SetDefinition, SetDefinitionId } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';
import { getSetDefinition } from '../other/circleUtils.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import { hatchPattern } from './hatchPattern.ts';

type DrawOverlappingAreaProps = {
  definitions: SetDefinition[];
  overlap: Section;
  highlightColors: string[] | null;
};

const drawOverlappingAreas = (
  ctx: CanvasRenderingContext2D,
  props: DrawOverlappingAreaProps,
  colors: SetColors,
) => {
  const { overlap, definitions, highlightColors } = props;
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

  const startingCoords = getWorldCoordinates({ clientX: 0, clientY: 0 }, ctx);
  const endingCoords = getWorldCoordinates(
    { clientX: window.innerWidth, clientY: window.innerHeight },
    ctx,
  );

  if (highlightColors === null) {
    ctx.fillStyle = colors.unhighlighted;
  } else if (highlightColors.length === 1) {
    ctx.fillStyle = highlightColors[0];
  } else {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = hatchPattern(ctx, highlightColors);
  }

  ctx.fillRect(
    startingCoords.x,
    startingCoords.y,
    endingCoords.x - startingCoords.x,
    endingCoords.y - startingCoords.y,
  );

  ctx.restore();
};

type ColorOverlappingAreasProps = {
  definitions: SetDefinition[];
  overlaps: Section[];
  highlightedSets: Map<SetDefinitionId, string[]>;
  highlightedOverlaps: Map<SectionKey, string[]>;
};

const getProperNonEmptySubsets = (
  setIds: SetDefinitionId[],
): SetDefinitionId[][] => {
  const subsets: SetDefinitionId[][] = [];
  const fullSetMask = 2 ** setIds.length - 1;

  // Each mask from 1 to fullSetMask - 1 represents one proper, non-empty subset,
  // where bit i indicates whether setIds[i] is included.
  for (let mask = 1; mask < fullSetMask; mask++) {
    const subset = setIds.filter((_, i) => mask & (1 << i));
    subsets.push(subset);
  }

  return subsets;
};

export const colorOverlappingAreas = (
  ctx: CanvasRenderingContext2D,
  props: ColorOverlappingAreasProps,
  colors: SetColors,
) => {
  const { definitions, overlaps, highlightedSets, highlightedOverlaps } = props;

  // an overlap region is geometrically nested inside every region formed by a
  // subset of its circles, so it must be redrawn (even just to erase it back to
  // background) whenever a single circle or a smaller
  // overlap is highlighted, otherwise that region's fill bleeds through
  const hasHighlightedAncestor = (setIds: SetDefinitionId[]) => {
    for (const subset of getProperNonEmptySubsets(setIds)) {
      if (subset.length === 1) {
        if (highlightedSets.has(subset[0])) return true;
        continue;
      }
      if (highlightedOverlaps.has(getSectionKey(subset))) return true;
    }
    return false;
  };

  for (const overlap of overlaps) {
    const highlightColors =
      highlightedOverlaps.get(getSectionKey(overlap)) ?? null;
    if (!highlightColors && !hasHighlightedAncestor(overlap)) continue;
    drawOverlappingAreas(
      ctx,
      { definitions, overlap, highlightColors },
      colors,
    );
  }
};
