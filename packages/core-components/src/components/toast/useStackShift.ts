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
  /** where each card came to rest when it was last measured, keyed by the card itself */
  const tops = new WeakMap<Element, number>();

  /** the shift a card is playing, so the next one can take over rather than fight it */
  const shifts = new WeakMap<Element, Animation>();

  const cards = () => [...(viewport.value?.children ?? [])];

  /**
   * a card on its way out is playing its own exit on the same transform, and a script
   * animation outranks a CSS one, so shifting it would snap it back into view for the
   * rest of its stay. it is leaving anyway, and its row goes with it
   */
  const isLeaving = (card: Element) =>
    card.getAttribute('data-state') === 'closed';

  const record = () => {
    for (const card of cards()) {
      tops.set(card, card.getBoundingClientRect().top);
    }
  };

  const shift = () => {
    for (const card of cards()) {
      if (isLeaving(card)) continue;

      const playing = shifts.get(card);

      /*
       * a card still shifting is between rows, and that is where the eye last saw it.
       * one at rest was last seen at the row it was recorded at, since the mutation
       * that brought us here has not been painted yet
       */
      const from =
        playing?.playState === 'running'
          ? card.getBoundingClientRect().top
          : tops.get(card);

      // a rect reports the new row only once the old shift is off the element
      playing?.cancel();
      const to = card.getBoundingClientRect().top;

      // recorded before animating, so the next shift reads a row and not a transform
      tops.set(card, to);

      // an unmeasured card has just arrived, and its entrance is its own to play
      if (from === undefined || from === to) continue;

      shifts.set(
        card,
        card.animate(
          [{ transform: `translateY(${from - to}px)` }, { transform: 'none' }],
          { duration: SHIFT_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        ),
      );
    }
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
