import type { Section, SetDefinition } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import { colorSection, hasHighlightedAncestor } from './colorSection.ts';

type ColorAllSectionsProps = {
  definitions: SetDefinition[];
  overlaps: Section[];
  sectionKeyToColors: Map<SectionKey, string[]>;
};

/**
 * colors every section that is itself highlighted, or that sits nested
 * inside a highlighted section and so must be redrawn to keep that color
 * from bleeding through. sections with no highlight and no highlighted
 * ancestor are left untouched.
 */
export const colorAllSections = (
  ctx: CanvasRenderingContext2D,
  props: ColorAllSectionsProps,
  colors: SetColors,
) => {
  const { definitions, overlaps, sectionKeyToColors } = props;

  for (const overlap of overlaps) {
    const highlightColors = sectionKeyToColors.get(getSectionKey(overlap));
    if (!highlightColors && !hasHighlightedAncestor(overlap, sectionKeyToColors)) {
      continue;
    }
    colorSection(ctx, {
      definitions,
      overlap,
      colors: highlightColors ?? [colors.unhighlighted],
    });
  }
};
