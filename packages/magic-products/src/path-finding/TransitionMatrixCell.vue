<script setup lang="ts">
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useEdgeStyles } from '@magic/shared/theme/edge';

  import { onUnmounted } from 'vue';

  const props = defineProps<{ edgeId: string }>();

  const graph = useProvidedGraph();
  const { styles, dispose } = useEdgeStyles(graph, props.edgeId);

  const hoverThemer = graph.theme.createThemer({
    canvas: {
      'edge.default.color': (edge) =>
        edge.id === props.edgeId
          ? graph.focus.theme._resolveToken('edge.focus.color', edge)
          : undefined,
    },
  });

  const setHovered = (hovered: boolean) => {
    if (hovered) hoverThemer.activate();
    else hoverThemer.deactivate();
  };

  onUnmounted(() => {
    dispose();
    hoverThemer.deactivate();
  });
</script>

<template>
  <slot
    :color="styles.color"
    :cursor="styles.cursor"
    :set-hovered="setHovered"
  />
</template>
