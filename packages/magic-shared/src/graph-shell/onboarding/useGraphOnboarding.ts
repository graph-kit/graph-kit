import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';

import { Graph } from '../../graph/types.ts';
import { AppearanceControls } from '../../ui/appearance/useShellAppearance.ts';
import { onboardingElements } from './elements.ts';
import { onboardingLayout } from './layout.ts';
import { onboardingPalette } from './palette.ts';
import { OnboardingItem } from './types.ts';

/**
 * The card an empty canvas opens on, listing what the product can do as an image beside
 * the name of the thing it shows. Nothing here decides when it belongs on screen, which
 * is the shell's call, see {@link show}
 */
export const useGraphOnboarding = (graph: Graph, items: OnboardingItem[]) => {
  // nothing to paint until `show` builds the card, see below
  let elements: () => CanvasElement[] = () => [];

  const transformer: AggregatorTransformer = (agg) => {
    agg.push(...elements());
    return agg;
  };

  const hide = () => graph.surface.aggregator.removeTransformer(transformer);

  /**
   * Places the card on whatever the canvas is showing right now and leaves it there. The
   * position is taken once, so panning moves the card with the rest of the world rather
   * than pinning it to the viewport
   */
  const show = (appearance: AppearanceControls) => {
    hide();

    const layout = onboardingLayout(
      items,
      graph.surface.visibleWorldRect.value,
    );
    // rebuilt per frame off the appearance, so toggling light and dark repaints the card
    elements = () =>
      onboardingElements(
        items,
        layout,
        onboardingPalette(appearance.state.value),
      );

    graph.surface.aggregator.addTransformer(transformer);
  };

  return {
    show,
    hide,
  };
};
