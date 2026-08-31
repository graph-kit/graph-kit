/** what the help menu shows for one thing a user can do */
export type HelpMenuEntry = {
  /** the group it lands in, see CATEGORY_ORDER for where the shell's own groups sit */
  category: string;
  /** what it does, read next to the keys */
  name: string;
};

/** anything the menu can list carries one of these */
export type WithHelpMenuEntry = {
  /**
   * absent for something registered but not worth a row of its own, like the second
   * binding for an action already listed under the first
   */
  helpMenu?: HelpMenuEntry;
};

/**
 * the pointer gestures a product can document, named after the canvas events they
 * arrive on, so a product declares the same word it subscribed to. how each one reads
 * and what it looks like lives in GESTURE_DISPLAY
 */
export type Gesture = 'click' | 'dblclick' | 'contextmenu' | 'drag' | 'wheel';

/**
 * something a product does that no shortcut covers, so it says how it is performed.
 * an entry rather than something carrying one: it exists only to be listed
 */
export type HelpMenuGesture = HelpMenuEntry & {
  id: string;
  /** how it is performed, read where a shortcut prints its keys */
  gesture: Gesture;
};

/** one key or one gesture, as the menu prints it */
export type HelpMenuChip = {
  text: string;
  /** an mdi path, on a gesture's chip only: a key is its own picture */
  icon?: string;
};

export type HelpMenuRow = {
  name: string;
  /** what performs it, a chip per key or the single chip a gesture reads as */
  trigger: HelpMenuChip[];
};

export type HelpMenuSection = {
  category: string;
  rows: HelpMenuRow[];
};
