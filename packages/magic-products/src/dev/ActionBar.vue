<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
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
