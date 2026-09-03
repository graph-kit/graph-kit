<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { DfsFrame } from '../frame.ts';

  const currentFrame = useCurrentFrame<DfsFrame>();
  const visited = computed(() => currentFrame.value?.visitedNodeIds ?? []);
</script>

<template>
  <NodeList
    :ids="visited"
    exit-side="left"
  />
</template>
