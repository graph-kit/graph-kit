import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';
import { devAssert } from '@core/utils/debugging';

import { ComputedRef, computed, ref } from 'vue';

import { ShellFlags } from '../product/flags.ts';
import { ProductId } from '../product/manifests/index.ts';
import { ProductControls } from '../product/types.ts';
import { AppearanceControls } from '../ui/appearance/useShellAppearance.ts';
import { onboardingElements } from './elements.ts';
import { hasOnboarded, markOnboarded } from './hasOnboarded.ts';
import { onboardingLayout } from './layout.ts';
import { onboardingPalette } from './palette.ts';
import { OnboardingItem } from './types.ts';

export type OnboardingControls = {
  /** puts the card on what the canvas is showing, unless this browser already onboarded */
  open: () => void;
  /**
   * takes it down and marks this browser onboarded for good. called the moment the
   * prompt stops being true, which only the product knows
   */
  close: () => void;
  /** whether the card is up */
  isActive: ComputedRef<boolean>;
};

export type OnboardingOptions = {
  product: Pick<ProductControls, 'surface'>;
  flags: ShellFlags;
  appearance: AppearanceControls;
  /** what the completion is remembered under, so onboarding is per product */
  productId: ProductId;
  /** what this product suggests trying first */
  items?: OnboardingItem[];
};

/**
 * The card a product opens on, listing what to try first. The shell puts it up and never
 * takes it down: only the product knows when its prompt stops being worth reading, see
 * {@link OnboardingControls.close}.
 *
 * Absent when the product flagged it off or contributed no items
 */
export const useOnboarding = ({
  product,
  flags,
  appearance,
  productId,
  items,
}: OnboardingOptions): OnboardingControls | undefined => {
  const { surface } = product;
  if (!flags.onboarding || !items) return;

  devAssert(
    items.length > 0,
    `[shell] ${productId} named an onboarding with no items in it`,
  );
  if (items.length === 0) return;

  // nothing to paint until `open` builds the card
  let elements: () => CanvasElement[] = () => [];

  const transformer: AggregatorTransformer = (agg) => {
    agg.push(...elements());
    return agg;
  };

  const active = ref(false);

  const takeDown = () => {
    active.value = false;
    surface.aggregator.removeTransformer(transformer);
  };

  const close = () => {
    markOnboarded(productId);
    takeDown();
  };

  const open = () => {
    if (hasOnboarded(productId)) return;

    takeDown();
    active.value = true;

    const layout = onboardingLayout(items, surface.visibleWorldRect.value);
    // re-read per frame, so toggling light and dark repaints the card
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
