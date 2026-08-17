<script setup lang="ts">
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useEdgeStyles } from '@magic/shared/theme/edge';

  import { onUnmounted } from 'vue';

  // resolves the same theme-driven color/cursor a real edge renders with on
  // canvas, so a matrix cell backed by an edge looks and updates (hover,
  // focus, theme changes) exactly like that edge does - a scoped slot rather
  // than owning the <td> itself, since the parent still drives everything
  // else about the cell (weight border, row/column hover wash, click)
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
