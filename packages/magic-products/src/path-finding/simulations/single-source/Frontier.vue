<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { SingleSourceFrame } from './frame.ts';

  const currentFrame = useCurrentFrame<SingleSourceFrame>();

  /*
    only dijkstra keeps a frontier. bellman ford sweeps every edge every pass
    and has none, so it leaves this empty, and an empty list slides the panel
    away on its own
  */
  const frontier = computed(() => currentFrame.value?.pendingNodeIds ?? []);
</script>

<template>
  <NodeList :ids="frontier" />
</template>
