<script setup lang="ts">
  import { mdiClose } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import IconButton from '../../components/icon-button/IconButton.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
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
  <Well class="pl-4">
    <HStack>
      <h2 class="text-lg font-bold">Need Inspiration?</h2>
      <Button @click="build">Build Me A Graph</Button>
      <IconButton
        @click="dismiss"
        :path="mdiClose"
        label="Close"
        :size="24"
        class="bg-transparent dark:bg-transparent p-1 hover:text-red-500"
      />
    </HStack>
  </Well>
</template>
