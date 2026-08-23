import { type ToastSeverity } from '@core/components/Toast/types';

import { Component, ComputedRef } from 'vue';

export type { ToastSeverity };

export type ToastButton = {
  textContent: string;
  onClick?: () => void;
  /** renders the action as a real link, so the browser owns the navigation */
  href?: string;
};

/** the toast the harness renders for you */
type StandardToast = {
  title: string;
  description?: string;
  severity: ToastSeverity;
  buttons?: ToastButton[];
};

/**
 * the escape hatch: this component sits inside the toast chrome and owns everything
 * within it, including whether it offers a way to close. the queue, the timer, swipe
 * to dismiss and the announcement still come from the harness
 */
type CustomToast = {
  component: Component;
  /** handed to the component. untyped, since the caller owns both ends of it */
  props?: Record<string, unknown>;
};

export type ToastOptions = (StandardToast | CustomToast) & {
  /** milliseconds until it takes itself down, or one that waits to be acknowledged */
  duration: number | 'persistent';
};

export type ToastEntry = ToastOptions & {
  id: string;
  /**
   * false once it has been dismissed, which is what plays the exit animation. it stays
   * in the queue for that long, so a reader wanting only what is still arriving has to
   * check this rather than assume presence means shown
   */
  open: boolean;
};

export type ToastControls = {
  entries: ComputedRef<ToastEntry[]>;
  /** answers with the id, so a caller that outlives the toast can take it down itself */
  show: (options: ToastOptions) => ToastEntry['id'];
  dismiss: (id: ToastEntry['id']) => void;
  dismissAll: () => void;
};

export const isCustomToast = (
  toast: ToastOptions,
): toast is CustomToast & { duration: ToastOptions['duration'] } =>
  'component' in toast;
