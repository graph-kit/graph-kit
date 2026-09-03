<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { DfsFrame } from '../frame.ts';

  const currentFrame = useCurrentFrame<DfsFrame>();
  const frontier = computed(() => currentFrame.value?.frontierNodeIds ?? []);
</script>

<template>
  <NodeList :ids="frontier" />
</template>
