<script setup lang="ts">
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useEdgeStyles } from '@magic/shared/theme/edge';

  import { onUnmounted } from 'vue';

  const props = defineProps<{ edgeId: string }>();

  const graph = useProvidedGraph();
  const { styles, dispose } = useEdgeStyles(graph, props.edgeId);
  onUnmounted(dispose);
</script>

<template>
  <slot
    :color="styles.color"
    :cursor="styles.cursor"
  />
</template>
