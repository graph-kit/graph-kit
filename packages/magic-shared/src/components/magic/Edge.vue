<script setup lang="ts">
  import HStack from '@core/components/HStack';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import type { GEdge } from '@magic/shared/graph/types';
  import { useEdgeStyles } from '@magic/shared/theme';
  import tinycolor from 'tinycolor2';

  import { StyleValue, computed, onUnmounted } from 'vue';

  const props = withDefaults(
    defineProps<{
      id: GEdge['id'];
      scale?: number;
      width?: number;
    }>(),
    { scale: 1 },
  );

  const graph = useProvidedGraph();

  const { styles, dispose } = useEdgeStyles(graph, props.id);

  const buttonStyle = computed<StyleValue>(() => ({
    width:
      props.width !== undefined
        ? `calc(var(--spacing) * ${props.width})`
        : undefined,
  }));

  const edgeStyle = computed<StyleValue>(() => ({
    backgroundColor: tinycolor(styles.value.color).setAlpha(1).toHexString(),
    height: styles.value.width * props.scale + 'px',
    placeItems: 'center',
  }));

  const labelStyle = computed<StyleValue>(() => ({
    fontSize: `calc(1rem * ${props.scale})`,
    maxWidth: 'calc(3ch + 10px)',
    boxSizing: 'content-box',
    flexShrink: 0,
  }));

  onUnmounted(dispose);
</script>

<template>
  <button :style="buttonStyle">
    <HStack
      @click="graph.focus.set([id])"
      class="cursor-pointer"
    >
      <div
        class="flex-1 h-full"
        :style="edgeStyle"
      />

      <div
        class="px-1 flex items-center justify-center overflow-hidden"
        :style="labelStyle"
      >
        <span class="font-bold truncate min-w-0">
          {{ styles.text.content }}
        </span>
      </div>

      <div
        class="flex-1 h-full"
        :style="edgeStyle"
      />
    </HStack>
  </button>
</template>
