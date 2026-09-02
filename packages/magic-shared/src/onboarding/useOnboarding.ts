import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';

import { ComputedRef, computed, ref } from 'vue';

import { ShellFlags } from '../product/flags.ts';
import { ProductControls } from '../product/types.ts';
import { AppearanceControls } from '../ui/appearance/useShellAppearance.ts';
import { onboardingElements } from './elements.ts';
import { onboardingLayout } from './layout.ts';
import { onboardingPalette } from './palette.ts';
import { OnboardingItem } from './types.ts';

export type OnboardingControls = {
  /** puts the card on whatever the canvas is showing right now */
  open: () => void;
  /**
   * takes it back down, whether or not it was up. what a product calls the moment its
   * prompt stops being true, which only the product is in a position to know
   */
  close: () => void;
  /** whether the card is up */
  isActive: ComputedRef<boolean>;
};

/**
 * The card a product opens on, listing what to try first as an image beside the name of
 * the gesture that gets there. The shell puts it up once setup is done and never takes
 * it down, since when a prompt has stopped being worth reading is the product's call,
 * see {@link OnboardingControls.close}.
 *
 * Absent when the product flagged it off or contributed no items
 */
export const useOnboarding = (
  host: Pick<ProductControls, 'surface'>,
  flags: ShellFlags,
  appearance: AppearanceControls,
  items: OnboardingItem[] = [],
): OnboardingControls | undefined => {
  const { surface } = host;
  if (!flags.onboarding || items.length === 0) return;

  // nothing to paint until `open` builds the card, see below
  let elements: () => CanvasElement[] = () => [];

  const transformer: AggregatorTransformer = (agg) => {
    agg.push(...elements());
    return agg;
  };

  const active = ref(false);

  const close = () => {
    active.value = false;
    surface.aggregator.removeTransformer(transformer);
  };

  const open = () => {
    close();
    active.value = true;

    const layout = onboardingLayout(items, surface.visibleWorldRect.value);
    // rebuilt per frame off the appearance, so toggling light and dark repaints the card
    elements = () =>
      onboardingElements(
        items,
        layout,
        onboardingPalette(appearance.state.value),
      );

    surface.aggregator.addTransformer(transformer);
  };

  return {
    open,
    close,
    isActive: computed(() => active.value),
  };
};
