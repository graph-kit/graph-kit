<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { DfsFrame } from '../frame.ts';

  const currentFrame = useCurrentFrame<DfsFrame>();
  const stacked = computed(() => currentFrame.value?.stackNodeIds ?? []);
</script>

<template>
  <NodeList :ids="stacked" />
</template>
