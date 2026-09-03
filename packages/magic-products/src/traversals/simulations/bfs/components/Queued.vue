<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { BfsFrame } from '../frame.ts';

  const currentFrame = useCurrentFrame<BfsFrame>();
  const queued = computed(() => currentFrame.value?.queuedNodeIds ?? []);
</script>

<template>
  <NodeList :ids="queued" />
</template>
