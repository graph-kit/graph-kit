/**
 * cursor types supported by the browser
 */
export const CURSOR = {
  AUTO: 'auto',
  DEFAULT: 'default',
  NONE: 'none',
  CONTEXT_MENU: 'context-menu',
  HELP: 'help',
  POINTER: 'pointer',
  PROGRESS: 'progress',
  WAIT: 'wait',
  CELL: 'cell',
  CROSSHAIR: 'crosshair',
  TEXT: 'text',
  VERTICAL_TEXT: 'vertical-text',
  ALIAS: 'alias',
  COPY: 'copy',
  MOVE: 'move',
  NO_DROP: 'no-drop',
  NOT_ALLOWED: 'not-allowed',
  GRAB: 'grab',
  GRABBING: 'grabbing',
  E_RESIZE: 'e-resize',
  N_RESIZE: 'n-resize',
  NE_RESIZE: 'ne-resize',
  NW_RESIZE: 'nw-resize',
  S_RESIZE: 's-resize',
  SE_RESIZE: 'se-resize',
  SW_RESIZE: 'sw-resize',
  W_RESIZE: 'w-resize',
  EW_RESIZE: 'ew-resize',
  NS_RESIZE: 'ns-resize',
  NESW_RESIZE: 'nesw-resize',
  NWSE_RESIZE: 'nwse-resize',
  COL_RESIZE: 'col-resize',
  ROW_RESIZE: 'row-resize',
  ALL_SCROLL: 'all-scroll',
  ZOOM_IN: 'zoom-in',
  ZOOM_OUT: 'zoom-out',
} as const;

/**
 * cursor types supported by the browser
 */
export type Cursor = (typeof CURSOR)[keyof typeof CURSOR];

const validCursors = new Set<string>(Object.values(CURSOR));

/** Type guard that returns true if input is a valid {@link Cursor}. */
export const isValidCursor = (cursorOrJunk: unknown): cursorOrJunk is Cursor =>
  typeof cursorOrJunk === 'string' && validCursors.has(cursorOrJunk);
