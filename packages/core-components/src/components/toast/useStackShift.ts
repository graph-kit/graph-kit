import { Ref, onMounted, onUnmounted, watch } from 'vue';

/** long enough to read as the stack settling, short enough not to trail the card leaving */
const SHIFT_MS = 200;

/**
 * Slides the cards that outlive a dismissal into their new places.
 *
 * Reka teleports every toast into the viewport, so there is no vnode list to hand a
 * TransitionGroup and no lifecycle hook that sees them move. What shifted can only be
 * learned from the viewport itself: measure where each card sits, and once one has come
 * or gone, play back the difference.
 */
export const useStackShift = (viewport: Ref<HTMLElement | undefined>) => {
  /** where each card sat when it was last measured, keyed by the card itself */
  const tops = new WeakMap<Element, number>();

  const cards = () => [...(viewport.value?.children ?? [])];

  const record = () => {
    for (const card of cards()) {
      tops.set(card, card.getBoundingClientRect().top);
    }
  };

  const shift = () => {
    for (const card of cards()) {
      const previous = tops.get(card);
      const next = card.getBoundingClientRect().top;
      // an unmeasured card has just arrived, and its entrance is its own to play
      if (previous === undefined || previous === next) continue;
      card.animate(
        [
          { transform: `translateY(${previous - next}px)` },
          { transform: 'none' },
        ],
        { duration: SHIFT_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    }
    record();
  };

  let observer: MutationObserver | undefined;

  onMounted(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // a card arriving or leaving is the only thing that moves the rest of the stack
    observer = new MutationObserver(shift);

    watch(
      viewport,
      (element) => {
        observer?.disconnect();
        if (!element) return;
        record();
        observer?.observe(element, { childList: true });
      },
      { immediate: true },
    );
  });

  onUnmounted(() => observer?.disconnect());
};
