<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useFocusedNode } from '@magic/shared/utilities';

  const graph = useProvidedGraph();
  const node = useFocusedNode(graph);
</script>

<template>
  <Well v-if="node">
    <HStack>
      <Node :id="node.id" />
    </HStack>
  </Well>
</template>
