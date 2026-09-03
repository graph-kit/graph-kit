<script setup lang="ts">
  import { onUnmounted } from 'vue';

  import { useProvidedGraph } from '../../graph-shell/context.ts';
  import { useEdgeStyles } from '../../theme/edge/index.ts';

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
