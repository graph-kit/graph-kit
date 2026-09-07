import { createEventHub } from '@core/events/createEventHub';

import { useComponent } from '../../component-slot/useComponent.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import { Graph } from '../../graph/types.ts';
import OnboardingGraphBanner from './OnboardingGraphBanner.vue';
import {
  BUILD_DURATION_MS,
  DEFAULT_ONBOARDING_GRAPH_OPTIONS,
  ONBOARDING_GRAPH_SLOT_ID,
} from './constants.ts';
import { provideOnboardingGraph } from './context.ts';
import { createOnboardingGraphEventRegistry } from './events.ts';
import { adoptExistingNodes, placeOnboardingGraph } from './layout.ts';
import { OnboardingGraph, OnboardingGraphControls } from './types.ts';

/** the banner offering to build the product's starting graph */
export const useOnboardingGraph = (
  componentSlots: ComponentSlotControls,
  graph: Graph,
  onboardingGraph?: OnboardingGraph,
): OnboardingGraphControls | undefined => {
  if (!onboardingGraph) return;

  const events = createEventHub(createOnboardingGraphEventRegistry());

  const options = {
    ...DEFAULT_ONBOARDING_GRAPH_OPTIONS,
    ...onboardingGraph.options,
  };

  const banner = useComponent(componentSlots, {
    id: ONBOARDING_GRAPH_SLOT_ID,
    component: OnboardingGraphBanner,
    position: 'top-middle',
  });

  const build = () => {
    events.emit('onBeforeOnboardingGraphBuilt');

    const onCanvas = {
      nodes: graph.nodes.value.map(({ id }) => ({ id })),
      edges: graph.edges.value.map(({ id }) => ({ id })),
    };

    const starting = adoptExistingNodes(
      placeOnboardingGraph(
        onboardingGraph,
        graph.surface.visibleWorldRect.value,
      ),
      onCanvas.nodes.map(({ id }) => id),
    );

    graph.animation.capture(
      () => {
        graph.actions.removeElements(onCanvas);
        graph.actions.addElements(starting);
      },
      { durationMs: BUILD_DURATION_MS },
    );

    graph.history.captureSnapshot();
    events.emit('onOnboardingGraphBuilt');
    banner.hide();
  };

  const controls: OnboardingGraphControls = {
    ...banner,
    events,
    build,
    options,
  };
  provideOnboardingGraph(controls);

  return controls;
};
