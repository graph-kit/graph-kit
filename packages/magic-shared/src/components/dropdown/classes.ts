// the panel surface, shared by the root menu and every submenu that opens off it
export const menuPanelClasses =
  'bg-gray-300 border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white';

// menu buttons sit on the panel's own surface, so they drop the button skin's background.
// the highlight background marks menu position, so a focus ring on top of it is redundant
export const menuItemClasses =
  'px-2 bg-transparent dark:bg-transparent dark:hover:bg-gray-900 w-full justify-start focus-visible:ring-0 focus-visible:ring-offset-0';
