import { Key } from 'ctrl-keys';

/** what the help menu shows for one thing a user can do */
export type HelpMenuEntry = {
  category: string;
  name: string;
};

/** anything the menu can list carries one of these */
export type WithHelpMenuEntry = {
  /** how it appears in the help menu, leaving empty means it doesn't surface at all */
  helpMenu?: HelpMenuEntry;
};

/** named after the canvas events they arrive on, so a product declares what it subscribed to */
export type Gesture = 'click' | 'dblclick' | 'contextmenu' | 'drag' | 'wheel';

/** something a product does that no shortcut covers, so it says how it is performed */
export type HelpMenuGesture = HelpMenuEntry & {
  id: string;
  gesture: Gesture;
};

/**
 * a key binding answered by something other than the shortcut registry
 */
export type HelpMenuBinding = HelpMenuEntry & {
  id: string;
  key: Key;
};

/** one row the menu can list on behalf of a plugin or a product */
export type HelpMenuItem = HelpMenuGesture | HelpMenuBinding;

/** one key or one gesture, as the menu prints it */
export type HelpMenuChip = {
  text: string;
  /** an mdi path, on a gesture's chip only */
  icon?: string;
};

export type HelpMenuRow = {
  name: string;
  /** a chip per key, or the one chip a gesture reads as */
  trigger: HelpMenuChip[];
};

export type HelpMenuSection = {
  category: string;
  rows: HelpMenuRow[];
};
