import type { Section, SetDefinition } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';
import { type SectionKey, getSectionKey } from '../other/sectionKey.ts';
import { colorSection, hasHighlightedAncestor } from './colorSection.ts';

type ColorAllSectionsProps = {
  definitions: SetDefinition[];
  sections: Section[];
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
  const { sections, definitions, sectionKeyToColors } = props;

  for (const section of sections) {
    const highlightColors = sectionKeyToColors.get(getSectionKey(section));
    if (
      !highlightColors &&
      !hasHighlightedAncestor(section, sectionKeyToColors)
    ) {
      continue;
    }
    colorSection(ctx, {
      definitions,
      section,
      colors: highlightColors ?? [colors.unhighlighted],
    });
  }
};
