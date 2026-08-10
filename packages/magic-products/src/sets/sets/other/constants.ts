import colors from '@core/utils/colors';
import { dark } from '@graph/theme-presets/dark/index';
import { light } from '@graph/theme-presets/light/index';
import { Magic } from '@magic/shared/product';
import { BasicColorMode } from '@vueuse/core';

import { computed } from 'vue';

export type SetColors = {
  unhighlighted: string;
  highlighted: string[];
  outline: {
    default: string;
    focused: string;
  };
  label: string;
};

const HIGHLIGHT_COLOR = [
  colors.RED_500,
  colors.BLUE_500,
  colors.EMERALD_500,
  colors.AMBER_500,
  colors.VIOLET_500,
  colors.PINK_500,
];

const DARK_COLORS = {
  highlighted: HIGHLIGHT_COLOR,
  unhighlighted: dark.canvas['node.default.color'],
  outline: {
    default: dark.canvas['node.default.border.color'],
    focused: dark.focus['node.focus.border.color'],
  },
  label: dark.canvas['node.default.text.color'],
} as const satisfies SetColors;

const LIGHT_COLORS = {
  highlighted: HIGHLIGHT_COLOR,
  unhighlighted: light.canvas['node.default.color'],
  outline: {
    default: light.canvas['node.default.border.color'],
    focused: light.focus['node.focus.border.color'],
  },
  label: light.canvas['node.default.text.color'],
} as const satisfies SetColors;

const themes: Record<BasicColorMode, SetColors> = {
  dark: DARK_COLORS,
  light: LIGHT_COLORS,
};

export const useSetColorTheme = (magic: Magic) =>
  computed(() => themes[magic.appearance.state.value]);

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

// every key that expands into latex as a query is typed
export const LATEX_HOTKEYS = {
  ...KEYBOARD_KEY_TO_LATEX,
  ...ADDITIONAL_KEY_BINDINGS,
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
