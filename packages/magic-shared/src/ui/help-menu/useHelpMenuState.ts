import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { ComputedRef, computed, ref } from 'vue';

import { ShortcutControls } from '../../shortcuts/useShortcuts.ts';
import { formatShortcutKey } from './formatShortcutKey.ts';
import { GESTURE_DISPLAY } from './gestures.ts';
import { HelpMenuGesture, HelpMenuRow, HelpMenuSection } from './types.ts';

export const HELP_MENU_KEY = 'h';

/** the shell's groups in display order; a product's own categories read before these */
const CATEGORY_ORDER = [
  'Graph',
  'Camera',
  'Simulation',
  'Annotations',
  'History',
  'View',
];

export type HelpMenuControls = {
  isOpen: ComputedRef<boolean>;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
  /** everything the shell and the product can do, grouped for display */
  sections: ComputedRef<HelpMenuSection[]>;
};

const byCategoryOrder = (previous: string, next: string) => {
  const previousRank = CATEGORY_ORDER.indexOf(previous);
  const nextRank = CATEGORY_ORDER.indexOf(next);
  if (previousRank === nextRank) return 0;
  if (previousRank === -1) return -1;
  if (nextRank === -1) return 1;
  return previousRank - nextRank;
};

export const useHelpMenuState = (
  shortcuts: ShortcutControls,
  gestures: MaybeGetter<HelpMenuGesture[]> = [],
): HelpMenuControls => {
  const isOpen = ref(false);

  const setOpen: HelpMenuControls['setOpen'] = (open) => (isOpen.value = open);

  const sections = computed(() => {
    const byCategory = new Map<string, HelpMenuRow[]>();

    const addRow = (category: string, row: HelpMenuRow) => {
      const rows = byCategory.get(category);
      if (rows) rows.push(row);
      else byCategory.set(category, [row]);
    };

    // read inside the computed, so a gesture leaves the menu with its plugin
    for (const gesture of getValue(gestures)) {
      const { label, icon } = GESTURE_DISPLAY[gesture.gesture];
      addRow(gesture.category, {
        name: gesture.name,
        trigger: [{ text: label, icon }],
      });
    }

    for (const shortcut of shortcuts.shortcuts.value) {
      if (!shortcut.helpMenu) continue;
      addRow(shortcut.helpMenu.category, {
        name: shortcut.helpMenu.name,
        trigger: formatShortcutKey(shortcut.key).map((text) => ({ text })),
      });
    }

    return [...byCategory]
      .map(([category, rows]) => ({ category, rows }))
      .sort((previous, next) =>
        byCategoryOrder(previous.category, next.category),
      );
  });

  return {
    isOpen: computed(() => isOpen.value),
    setOpen,
    toggle: () => setOpen(!isOpen.value),
    sections,
  };
};
