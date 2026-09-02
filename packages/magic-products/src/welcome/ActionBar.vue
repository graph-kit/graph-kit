<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import colors from '@core/utils/colors';
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import ProductCard from '@magic/shared/ProductCard';
  import Well from '@magic/shared/Well';
  import { ExplainerHighlight, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { createNodeThemer } from '@magic/shared/theme';
  import { productHref } from '@magic/shared/ui/index';
  import { useFocusedNode } from '@magic/shared/utilities';
  import { mdiArrowRight } from '@mdi/js';

  import { computed } from 'vue';

  import { productOf } from './scene.ts';

  const graph = useProvidedGraph();
  const focusedNode = useFocusedNode(graph);

  const activeProduct = computed(() =>
    focusedNode.value ? productOf(focusedNode.value.id) : undefined,
  );

  const nodeThemer = createNodeThemer(graph, colors.AMBER_500);

  const nodeHighlight: ExplainerHighlight = {
    tooltipLabel:
      'The basic object of a graph that can be connected to other nodes by edges.',
    activate: () => nodeThemer.activate(),
    deactivate: () => nodeThemer.deactivate(),
  };

  const experienceHighlight: ExplainerHighlight = {
    tooltipLabel: 'A place to build, break, and experiment.',
  };
</script>

<template>
  <Well
    v-if="activeProduct"
    class="w-140 p-0 select-none"
  >
    <Button
      :href="productHref(activeProduct.id)"
      class="w-full justify-between gap-4 bg-transparent p-3 hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-900"
    >
      <ProductCard
        :product-id="activeProduct.id"
        :card="
          nullThrows(activeProduct.navigation.card, 'no navigation card found')
        "
      />
      <HStack
        class="shrink-0 gap-2 rounded-md bg-gray-300 px-5 py-2 dark:bg-gray-700"
      >
        Open
        <Icon
          :path="mdiArrowRight"
          :size="20"
        />
      </HStack>
    </Button>
  </Well>

  <div
    v-else
    class="pb-8"
  >
    <ExplainerText
      :explainer="{
        content: 'Click A [Node] To Open [Experience]',
        highlights: [nodeHighlight, experienceHighlight],
      }"
    />
  </div>
</template>
