import type { Component } from 'vue';

/** Where in the GUI a component slot is rendered. */
export type SlotPosition =
  | 'top-left'
  | 'top-middle'
  | 'top-right'
  | 'center-left'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-middle'
  | 'bottom-right';

/** A component rendered into a fixed position in the GUI. */
export type ComponentSlot = {
  id: string;
  position: SlotPosition;
  component: Component;
  priority?: number;
};

export type HighlightProps = {
  isHighlighted: boolean;
  classes: string;
};
