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

// Labels that are reserved for structural use and cannot be used as circle names.
// S is the complement region (everything outside all defined circles).
export const RESERVED_LABELS = ['S'] as const;

export const KEY_TO_LATEX = {
  I: '\\cap',
  U: '\\cup',
  D: '\\triangle',
  O: '\\Omega',
  S: 'S',
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
