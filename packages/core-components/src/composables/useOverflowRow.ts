import {
  type MaybeComputedElementRef,
  unrefElement,
  useResizeObserver,
  useWindowSize,
} from '@vueuse/core';

import { onUpdated, ref, watch } from 'vue';

type OverflowRowElements = {
  /**
   * the flex row the items are laid out in, marked `relative`. it needs a max-width for
   * anything to ever overflow, and items inside it need a `data-overflow-item` attribute
   * to be measured. an item that misses out has to be taken out of the row by being
   * positioned, which is what the budget read puts back
   */
  row: MaybeComputedElementRef;
  /** what opens the overflow menu, measured so the last visible item never sits under it */
  trigger: MaybeComputedElementRef;
};

/**
 * The row is only ever as wide as what it is showing, so reading it as rendered would
 * report the width the last fit just finished filling, and nothing could come back once
 * it had been dropped. Every item goes back into the flow to push the row out to the
 * width it is allowed, and comes straight back out within the same frame.
 */
const readBudget = (row: HTMLElement, items: HTMLElement[]) => {
  for (const item of items) item.style.position = 'static';

  const style = getComputedStyle(row);
  const budget =
    row.getBoundingClientRect().width -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight) -
    parseFloat(style.borderLeftWidth) -
    parseFloat(style.borderRightWidth);

  for (const item of items) item.style.position = '';

  return budget;
};

/**
 * Works out how many of a row's items fit across it, so the rest can be handed to an
 * overflow menu.
 */
export const useOverflowRow = ({ row, trigger }: OverflowRowElements) => {
  const visibleCount = ref(Infinity);

  const measure = () => {
    const rowElement = unrefElement(row);
    const triggerElement = unrefElement(trigger);
    if (!(rowElement instanceof HTMLElement)) return;
    if (!(triggerElement instanceof HTMLElement)) return;

    const items = [
      ...rowElement.querySelectorAll<HTMLElement>(
        ':scope > [data-overflow-item]',
      ),
    ];

    const budget = readBudget(rowElement, items);
    const gap = parseFloat(getComputedStyle(rowElement).columnGap) || 0;

    // how wide the first n items are laid out side by side, gaps included
    const widthOfFirst = [0];
    for (const item of items) {
      const previous = widthOfFirst.at(-1) ?? 0;
      const gapBefore = widthOfFirst.length > 1 ? gap : 0;
      const { width } = item.getBoundingClientRect();
      widthOfFirst.push(previous + gapBefore + width);
    }

    const triggerSpace = gap + triggerElement.getBoundingClientRect().width;

    // showing everything is the one case that owes the trigger no room
    const fits = (count: number) => {
      const width = widthOfFirst[count] ?? 0;
      const withTrigger = count < items.length ? triggerSpace : 0;
      return width + withTrigger <= budget;
    };

    let visible = items.length;
    while (visible > 0 && !fits(visible)) visible--;
    visibleCount.value = visible;
  };

  // the row hugs what it shows, so its own size changing is the main signal that the
  // answer has moved. the budget read leaves it the size it found it, so this holds
  useResizeObserver(row, measure);

  // an item joining an already-overflowing row changes nothing on screen, so the render
  // is the only signal that the lineup grew
  onUpdated(measure);

  const { width: viewportWidth } = useWindowSize();
  watch(viewportWidth, measure);

  return { visibleCount };
};
