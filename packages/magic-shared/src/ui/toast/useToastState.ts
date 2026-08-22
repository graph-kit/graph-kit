import { computed, ref } from 'vue';

import { ToastControls, ToastEntry, ToastOptions } from './types.ts';

/** past this the stack is a wall rather than a message, so the oldest makes way */
const MAX_STACKED_TOASTS = 4;

/** long enough for the exit animation in @core/components/Toast to finish */
const EXIT_ANIMATION_MS = 200;

const entries = ref<ToastEntry[]>([]);

const drop = (id: ToastEntry['id']) => {
  entries.value = entries.value.filter((entry) => entry.id !== id);
};

const dismiss: ToastControls['dismiss'] = (id) => {
  const entry = entries.value.find((candidate) => candidate.id === id);
  // already leaving, so a second dismiss would queue a second removal
  if (!entry?.open) return;
  entry.open = false;
  setTimeout(() => drop(id), EXIT_ANIMATION_MS);
};

const show: ToastControls['show'] = (options: ToastOptions) => {
  const id = crypto.randomUUID();
  entries.value.push({ ...options, id, open: true });

  const showing = entries.value.filter((entry) => entry.open);
  for (const evicted of showing.slice(0, -MAX_STACKED_TOASTS)) {
    dismiss(evicted.id);
  }

  return id;
};

const toast: ToastControls = {
  entries: computed(() => entries.value),
  show,
  dismiss,
  dismissAll: () => {
    for (const entry of entries.value) dismiss(entry.id);
  },
};

/**
 * One queue for the whole app rather than one per product, so anything holding a
 * reference can speak up: code outside a component, a room connection that outlives
 * the page it was opened on, a product tearing itself down.
 */
export const useToastState = (): ToastControls => toast;

export { toast };
