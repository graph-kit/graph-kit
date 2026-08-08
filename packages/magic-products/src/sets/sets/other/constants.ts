export const COLORS = {
  HIGHLIGHT: [
    "#EF4444", // red
    "#3B82F6", // blue
    "#10B981", // emerald
    "#F59E0B", // amber
    "#8B5CF6", // violet
    "#EC4899", // pink
  ],
  BACKGROUND: 'rgb(55, 65, 81)', // bg-gray-700 tailwind
  CIRCLE_OUTLINE: '#8d99ae',
  CIRCLE_FOCUSED: '#edf2f4',
} as const

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Labels that are reserved for structural use and cannot be used as circle names.
// S is the complement region (everything outside all defined circles).
export const RESERVED_LABELS = ['S'] as const

export const KEY_TO_LATEX = {
    I: "\\cap",
    U: "\\cup",
    D: "\\triangle",
    O: "\\Omega",
    S: "S",
    C: "^\\complement",
    '\\': '\\setminus',
    } as const

  export const ADDITIONAL_KEY_BINDINGS = {
    '-': '\\setminus',
    '+': '\\cup',
  } as const

  export const LATEX_SET_SYMBOLS = {
    SET_MINUS: 'SetMinus',
    UNION: 'Union',
    INTERSECTION: 'Intersection',
    SYMMETRIC_DIFFERENCE: 'SymmetricDifference',
    COMPLEMENT: 'Complement',
    OMEGA: 'Omega',
  }

  export type LatexSetOperation = typeof LATEX_SET_SYMBOLS[keyof typeof LATEX_SET_SYMBOLS]
