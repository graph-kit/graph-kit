import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { ComputedRef, computed, ref } from 'vue';

import { ShortcutControls } from '../../shortcuts/useShortcuts.ts';
import { formatShortcutKey } from './formatShortcutKey.ts';
import { GESTURE_DISPLAY } from './gestures.ts';
import { HelpMenuGesture, HelpMenuRow, HelpMenuSection } from './types.ts';

/** the groups the shell fills, in the order they read best. the product's own read first */
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
  // a category the shell does not name is the product's own, and what the product does
  // is what someone opened the menu for, so it goes above the chrome around it
  if (previousRank === -1) return -1;
  if (nextRank === -1) return 1;
  return previousRank - nextRank;
};

/** the help dialog, reachable in every product with the "h" key */
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

    // a shortcut with nothing to say about itself is registered but not listed
    for (const shortcut of shortcuts.shortcuts.value) {
      if (!shortcut.helpMenu) continue;
      addRow(shortcut.helpMenu.category, {
        name: shortcut.helpMenu.name,
        trigger: formatShortcutKey(shortcut.key).map((text) => ({ text })),
      });
    }

    // read through the getter inside the computed, so a gesture that comes and goes
    // with the plugin answering it comes and goes from the menu with it
    for (const gesture of getValue(gestures)) {
      const { label, icon } = GESTURE_DISPLAY[gesture.gesture];
      addRow(gesture.category, {
        name: gesture.name,
        trigger: [{ text: label, icon }],
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
