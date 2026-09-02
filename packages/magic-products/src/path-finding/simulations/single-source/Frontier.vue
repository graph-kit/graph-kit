<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { SingleSourceFrame } from './frame.ts';

  const currentFrame = useCurrentFrame<SingleSourceFrame>();

  const frontier = computed(() => currentFrame.value?.pendingNodeIds ?? []);
</script>

<template>
  <NodeList
    :ids="frontier"
    title="Frontier"
  />
</template>
