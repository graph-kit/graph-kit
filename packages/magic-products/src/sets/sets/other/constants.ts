import colors from '@core/utils/colors';

import type { Section } from '../../types.ts';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// the palette a highlight query's color is assigned from, in creation order
export const HIGHLIGHT_COLORS = [
  colors.RED_500,
  colors.BLUE_500,
  colors.EMERALD_500,
  colors.AMBER_500,
  colors.VIOLET_500,
  colors.PINK_500,
];

/**
 * the region covered by no set. it has no definition to point at, so it carries both
 * halves of one here: what a query calls it, and what stands in for its id in a Section
 */
export const OUTSIDE_ALL_SETS = {
  label: 'S',
  identity: 'outside-all-sets',
} as const;

/** true when `section` is the region outside every set, see {@link OUTSIDE_ALL_SETS}. */
export const isOutsideAllSetsSection = (section: Section) => {
  // all the area outside every set is itself atomic, so checking the first id is enough
  return section.at(0) === OUTSIDE_ALL_SETS.identity;
};

// labels reserved for structural use, so they cannot name a set
export const RESERVED_LABELS = [OUTSIDE_ALL_SETS.label] as const;

export const DEFAULT_CIRCLE_RADIUS = 70;

// kept above the edge grab buffer so a shrunken circle stays resizable
export const MIN_CIRCLE_RADIUS = 35;

export const MAX_CIRCLE_RADIUS = 10_000;

// every set operator, keyed by the character that inserts it
export const SET_OP_TO_LATEX = {
  I: '\\cap',
  U: '\\cup',
  D: '\\triangle',
  O: '\\Omega',
  S: OUTSIDE_ALL_SETS.label,
  C: '^\\complement',
  '\\': '\\setminus',
} as const;

// a letter names a set until shift asks it for its operator, while these name no set and expand as they are typed
export const SYMBOL_KEY_TO_LATEX = {
  '\\': SET_OP_TO_LATEX['\\'],
  '-': SET_OP_TO_LATEX['\\'],
  '+': SET_OP_TO_LATEX.U,
} as const;

export const LATEX_SET_SYMBOLS = {
  SET_MINUS: 'SetMinus',
  UNION: 'Union',
  INTERSECTION: 'Intersection',
  SYMMETRIC_DIFFERENCE: 'SymmetricDifference',
  COMPLEMENT: 'Complement',
  OMEGA: 'Omega',
} as const;

export type LatexSetOperation =
  (typeof LATEX_SET_SYMBOLS)[keyof typeof LATEX_SET_SYMBOLS];
