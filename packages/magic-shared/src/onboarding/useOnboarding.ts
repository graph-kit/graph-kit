import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';

import { ShellFlags } from '../product/flags.ts';
import { ProductControls } from '../product/types.ts';
import { AppearanceControls } from '../ui/appearance/useShellAppearance.ts';
import { onboardingElements } from './elements.ts';
import { onboardingLayout } from './layout.ts';
import { onboardingPalette } from './palette.ts';
import { OnboardingItem } from './types.ts';

export type OnboardingControls = {
  /**
   * puts the card up if the product turns out to have opened on nothing, judged on the
   * first frame that can answer, see {@link ProductControls.isContent}
   */
  showWhenEmpty: () => void;
  /** puts the card on whatever the canvas is showing right now */
  show: () => void;
  /** takes it back down, whether or not it was up */
  hide: () => void;
};

/**
 * The card a product opens on when it has nothing to open on, listing what to try first
 * as an image beside the name of the gesture that gets there.
 *
 * Absent when the product flagged it off or contributed no items, and when it named no
 * content, since "opened on nothing" is not a question the shell can answer on its own
 */
export const useOnboarding = (
  host: Pick<ProductControls, 'surface' | 'isContent'>,
  flags: ShellFlags,
  appearance: AppearanceControls,
  items: OnboardingItem[] = [],
): OnboardingControls | undefined => {
  const { surface, isContent } = host;
  if (!flags.onboarding || items.length === 0 || !isContent) return;

  // nothing to paint until `show` builds the card, see below
  let elements: () => CanvasElement[] = () => [];

  const transformer: AggregatorTransformer = (agg) => {
    agg.push(...elements());
    return agg;
  };

  const hide = () => surface.aggregator.removeTransformer(transformer);

  const show = () => {
    hide();

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

  /*
    the aggregator holds what the last draw resolved, and setup finishes before the
    canvas has drawn once, so asking then would find every product empty. the first draw
    is both the earliest honest answer and the moment the camera the card is centered on
    is the one the product actually restored
  */
  const showWhenEmpty = () => {
    const decide = () => {
      surface.aggregator.events.unsubscribe('onDraw', decide);
      if (surface.aggregator.aggregator().some(isContent)) return;
      show();
    };

    surface.aggregator.events.subscribe('onDraw', decide);
  };

  return {
    showWhenEmpty,
    show,
    hide,
  };
};
