import colors, { type Color } from '@core/utils/colors';
import type { ShortcutKey } from '@magic/shared/shortcuts';

import type { Section } from './types.ts';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const INPUT_HANDLER_ID = {
  annotations: 'sets/annotations',
  circleDrag: 'sets/circle-drag',
  circleResize: 'sets/circle-resize',
  focus: 'sets/focus',
  createSet: 'sets/create-set',
} as const;

export const ANNOTATION_HANDLER_PRIORITY = {
  before: [
    INPUT_HANDLER_ID.circleDrag,
    INPUT_HANDLER_ID.circleResize,
    INPUT_HANDLER_ID.focus,
    INPUT_HANDLER_ID.createSet,
  ],
} as const;

// the palette a query's color is assigned from, in creation order
export const QUERY_COLORS: Color[] = [
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

/**
 * how many sets a canvas holds.
 *
 * every set doubles the partition the whole product works over, so an 8 set
 * canvas is already 256 regions to resolve a query against on every keystroke.
 */
export const MAX_SETS = 8;

/**
 * how far either side of a circle's edge counts as grabbing the edge rather
 * than the body, which is what makes an 8px outline a resize target
 */
export const EDGE_GRAB_BUFFER = 10;

export const DEFAULT_CIRCLE_RADIUS = 70;

// kept above the edge grab buffer so a shrunken circle stays resizable
export const MIN_CIRCLE_RADIUS = 35;

export const MAX_CIRCLE_RADIUS = 10_000;

type SetOp = {
  /** what typing it inserts into a query */
  latex: string;
  /** what it is called, for the tooltip its button shows */
  name: string;
  /** the binding that types it, which that same tooltip is rendered from */
  key: ShortcutKey;
};

/** every set operator, keyed by the character it is written with */
export const SET_OPS = {
  I: { latex: '\\cap', name: 'Intersection', key: 'mod+i' },
  U: { latex: '\\cup', name: 'Union', key: 'mod+u' },
  D: { latex: '\\triangle', name: 'Symmetric difference', key: 'mod+d' },
  O: { latex: '\\Omega', name: 'Universal set', key: 'mod+o' },
  S: { latex: OUTSIDE_ALL_SETS.label, name: 'Outside all sets', key: 'mod+s' },
  N: { latex: '\\neg', name: 'Negation', key: 'mod+n' },
  C: { latex: '^\\complement', name: 'Complement', key: 'mod+c' },
  '\\': { latex: '\\setminus', name: 'Difference', key: '\\' },
} as const satisfies Record<string, SetOp>;

export type SetOpKey = keyof typeof SET_OPS;

// a letter names a set until mod asks it for its operator, while this names no set and expands as it is typed
export const SYMBOL_KEY_TO_LATEX = {
  '\\': SET_OPS['\\'].latex,
} as const;

export const LATEX_SET_SYMBOLS = {
  SET_MINUS: 'SetMinus',
  UNION: 'Union',
  INTERSECTION: 'Intersection',
  SYMMETRIC_DIFFERENCE: 'SymmetricDifference',
  // the one head that is ours rather than the compute engine's, see parseMathJSON.ts
  NEGATION: 'Negation',
  OMEGA: 'Omega',
} as const;

export type LatexSetOperation =
  (typeof LATEX_SET_SYMBOLS)[keyof typeof LATEX_SET_SYMBOLS];
