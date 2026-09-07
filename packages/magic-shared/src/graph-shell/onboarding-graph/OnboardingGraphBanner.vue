<script setup lang="ts">
  import Button from '../../components/button/Button.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import CloseButton from '../../ui/CloseButton.vue';
  import { useProvidedGraph } from '../context.ts';
  import { BUILD_DURATION_MS, ONBOARDING_GRAPH_SLOT_ID } from './constants.ts';
  import { useProvidedOnboardingGraph } from './context.ts';
  import { placeOnboardingGraph } from './layout.ts';

  const graph = useProvidedGraph();
  const shell = useProvidedShell();
  const onboardingGraph = useProvidedOnboardingGraph();

  const dismiss = () => shell.componentSlots.remove(ONBOARDING_GRAPH_SLOT_ID);

  const build = () => {
    graph.animation.capture(
      () =>
        graph.actions.addElements(
          placeOnboardingGraph(
            onboardingGraph,
            graph.surface.visibleWorldRect.value,
          ),
        ),
      { durationMs: BUILD_DURATION_MS },
    );

    dismiss();
  };
</script>

<template>
  <Well class="py-4 px-12 text-center">
    <CloseButton @closed="dismiss" />
    <VStack class="gap-3 items-center">
      <h2 class="text-xl font-bold">Start With A Graph?</h2>
      <Button @click="build">Build One For Me</Button>
    </VStack>
  </Well>
</template>
