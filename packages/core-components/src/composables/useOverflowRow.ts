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
   * positioned, which is what the natural read puts back
   */
  row: MaybeComputedElementRef;
  /**
   * what opens the overflow menu, measured so the last visible item never sits under it.
   * it has to stay in the row whether or not it has anything to open: a width that only
   * exists once the menu is needed is a width the pass that decides it cannot read
   */
  trigger: MaybeComputedElementRef;
};

/**
 * a row of separately measured boxes sums a hair wider than the single box it fills, and
 * by how much differs between browsers. a fraction of a pixel is never the difference
 * between fitting and not, and treating it as one leaves the row cycling
 */
const SUBPIXEL_SLACK = 0.5;

type RowMeasurement = {
  /** the width the row is allowed, whatever it currently happens to be showing */
  budget: number;
  gap: number;
  itemWidths: number[];
  triggerWidth: number;
};

/**
 * The row is only ever as wide as what it is showing, so reading it as rendered would
 * report the width the last fit just finished filling, and nothing could come back once
 * it had been dropped. Every item goes back into the flow at a width it cannot give from,
 * pushing the row out to the width it is allowed, and comes straight back out within the
 * same frame.
 *
 * The trigger goes the other way, out of the flow for the read. It is the one thing whose
 * presence the answer decides, so measuring the row around it hands back a budget that is
 * larger on the passes where it is showing than on the passes where it is not, and the
 * row cycles between the two forever.
 */
const readNaturalWidths = (
  row: HTMLElement,
  items: HTMLElement[],
  trigger: HTMLElement | undefined,
): RowMeasurement => {
  const restore = [...items, ...(trigger ? [trigger] : [])].map((element) => ({
    element,
    position: element.style.position,
    flexShrink: element.style.flexShrink,
  }));

  for (const item of items) {
    item.style.position = 'static';
    item.style.flexShrink = '0';
  }
  if (trigger) trigger.style.position = 'absolute';

  const style = getComputedStyle(row);
  const budget =
    row.getBoundingClientRect().width -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight) -
    parseFloat(style.borderLeftWidth) -
    parseFloat(style.borderRightWidth);

  // every width comes out of this one layout, so the pass costs a single reflow and
  // reads every box in the same configuration
  const measurement: RowMeasurement = {
    budget,
    gap: parseFloat(style.columnGap) || 0,
    itemWidths: items.map((item) => item.getBoundingClientRect().width),
    triggerWidth: trigger?.getBoundingClientRect().width ?? 0,
  };

  for (const { element, position, flexShrink } of restore) {
    element.style.position = position;
    element.style.flexShrink = flexShrink;
  }

  return measurement;
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

    const items = [
      ...rowElement.querySelectorAll<HTMLElement>(
        ':scope > [data-overflow-item]',
      ),
    ];

    const { budget, gap, itemWidths, triggerWidth } = readNaturalWidths(
      rowElement,
      items,
      triggerElement instanceof HTMLElement ? triggerElement : undefined,
    );

    // how wide the first n items are laid out side by side, gaps included
    const widthOfFirst = [0];
    for (const width of itemWidths) {
      const previous = widthOfFirst.at(-1) ?? 0;
      const gapBefore = widthOfFirst.length > 1 ? gap : 0;
      widthOfFirst.push(previous + gapBefore + width);
    }

    const triggerSpace = triggerWidth > 0 ? gap + triggerWidth : 0;

    // showing everything is the one case that owes the trigger no room
    const fits = (count: number) => {
      const width = widthOfFirst[count] ?? 0;
      const withTrigger = count < items.length ? triggerSpace : 0;
      return width + withTrigger <= budget + SUBPIXEL_SLACK;
    };

    let visible = items.length;
    while (visible > 0 && !fits(visible)) visible--;
    visibleCount.value = visible;
  };

  // the row hugs what it shows, so its own size changing is the main signal that the
  // answer has moved. the natural read leaves it the size it found it, so this holds
  useResizeObserver(row, measure);

  // an item joining an already-overflowing row changes nothing on screen, so the render
  // is the only signal that the lineup grew
  onUpdated(measure);

  const { width: viewportWidth } = useWindowSize();
  watch(viewportWidth, measure);

  return { visibleCount };
};
