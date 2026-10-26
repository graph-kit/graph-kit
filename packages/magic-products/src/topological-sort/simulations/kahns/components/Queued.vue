<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { KahnsFrame } from '../frame.ts';

  const currentFrame = useCurrentFrame<KahnsFrame>();
  const queued = computed(() => currentFrame.value?.queuedNodeIds ?? []);
</script>

<template>
  <NodeList
    :ids="queued"
    title="Queue"
  />
</template>
