import { type TooltipContentProps } from 'reka-ui';

import { type HTMLAttributes } from 'vue';

/** where the tooltip sits relative to its trigger */
export type TooltipSide = TooltipContentProps['side'];

/**
 * How a tooltip behaves, as opposed to what it says. Named separately so a component
 * that works out its own content can accept the rest of this wholesale, and go on
 * accepting it when something new is added here.
 */
export interface TooltipOptions {
  side?: TooltipSide;
  /** milliseconds of hover before it opens. zero is immediate, which is the default */
  delay?: number;
  class?: HTMLAttributes['class'];
}

export interface TooltipProps extends TooltipOptions {
  /**
   * required, plain-text description used for the accessible name/description.
   * always what screen readers announce, regardless of what's slotted visually.
   */
  label: string | undefined;
}
