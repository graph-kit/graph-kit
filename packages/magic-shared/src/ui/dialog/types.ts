import { ComputedRef } from 'vue';

/** a button in the dialog's action row, shaped like the toast's, see `../toast` */
export type DialogAction = { textContent: string } & (
  | { onClick: () => void; href?: never }
  /** renders the action as a real link, so the browser owns the navigation */
  | { href: string; onClick?: never }
);

export type DialogOptions = {
  title: string;
  description?: string;
  /** the row along the bottom. taking one closes the dialog */
  actions?: DialogAction[];
};

export type DialogEntry = DialogOptions & { id: string };

export type DialogControls = {
  /** what is on screen, undefined when nothing is */
  entry: ComputedRef<DialogEntry | undefined>;
  /**
   * puts one up, taking the screen from whatever was already there. answers with the
   * id, so a caller that outlives the dialog can take it down itself
   */
  open: (options: DialogOptions) => DialogEntry['id'];
  /** does nothing once something else holds the screen, so a late close cannot take it */
  close: (id: DialogEntry['id']) => void;
};
