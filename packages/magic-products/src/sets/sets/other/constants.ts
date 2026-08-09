import colors from '@core/utils/colors';

export const COLORS = {
  HIGHLIGHT: [
    colors.RED_500,
    colors.BLUE_500,
    colors.EMERALD_500,
    colors.AMBER_500,
    colors.VIOLET_500,
    colors.PINK_500,
  ],
  BACKGROUND: colors.GRAY_600,
  CIRCLE_OUTLINE: colors.WHITE,
  CIRCLE_FOCUSED: colors.RED_600,
} as const;

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * the region covered by no set. it has no definition to point at, so it carries both
 * halves of one here: what a query calls it, and what stands in for its id in a Section
 */
export const OUTSIDE_ALL_SETS = {
  label: 'S',
  identity: 'outside-all-sets',
} as const;

// labels reserved for structural use, so they cannot name a set
export const RESERVED_LABELS = [OUTSIDE_ALL_SETS.label] as const;

export const DEFAULT_CIRCLE_RADIUS = 70;

export const KEYBOARD_KEY_TO_LATEX = {
  I: '\\cap',
  U: '\\cup',
  D: '\\triangle',
  O: '\\Omega',
  S: OUTSIDE_ALL_SETS.label,
  C: '^\\complement',
  '\\': '\\setminus',
} as const;

export const ADDITIONAL_KEY_BINDINGS = {
  '-': '\\setminus',
  '+': '\\cup',
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
