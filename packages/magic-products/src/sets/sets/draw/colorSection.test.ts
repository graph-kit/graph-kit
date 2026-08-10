import { describe, expect, it } from 'vitest';

import { getSectionKey } from '../other/sectionKey.ts';
import { getAncestorSections, hasHighlightedAncestor } from './colorSection.ts';

describe(getAncestorSections, () => {
  it('returns nothing for a single-set section', () => {
    expect(getAncestorSections(['A'])).toEqual([]);
  });

  it('returns the two singletons for a two-way section', () => {
    expect(getAncestorSections(['A', 'B'])).toEqual([['A'], ['B']]);
  });

  it('returns every proper, non-empty subset for a three-way section', () => {
    const ancestors = getAncestorSections(['A', 'B', 'C']);
    expect(ancestors).toHaveLength(6);
    expect(ancestors.map(getSectionKey).sort()).toEqual(
      ['A', 'B', 'C', 'A.B', 'A.C', 'B.C'].sort(),
    );
  });
});

describe(hasHighlightedAncestor, () => {
  it('is false when nothing is highlighted', () => {
    expect(hasHighlightedAncestor(['A', 'B'], new Map(), new Map())).toBe(
      false,
    );
  });

  it('is true when a single-set ancestor is highlighted', () => {
    const highlightedSets = new Map([['A', ['red']]]);
    expect(hasHighlightedAncestor(['A', 'B'], highlightedSets, new Map())).toBe(
      true,
    );
  });

  it('is true when a multi-set ancestor overlap is highlighted', () => {
    const highlightedOverlaps = new Map([[getSectionKey(['A', 'B']), ['red']]]);
    expect(
      hasHighlightedAncestor(['A', 'B', 'C'], new Map(), highlightedOverlaps),
    ).toBe(true);
  });

  it('ignores the section itself, only its ancestors count', () => {
    const highlightedOverlaps = new Map([[getSectionKey(['A', 'B']), ['red']]]);
    expect(
      hasHighlightedAncestor(['A', 'B'], new Map(), highlightedOverlaps),
    ).toBe(false);
  });

  it('ignores highlights on sets outside the section', () => {
    const highlightedSets = new Map([['Z', ['red']]]);
    expect(hasHighlightedAncestor(['A', 'B'], highlightedSets, new Map())).toBe(
      false,
    );
  });
});
