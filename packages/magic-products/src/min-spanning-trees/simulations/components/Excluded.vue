<script setup lang="ts">
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { PrimsFrame } from '../frame.ts';
  import EdgeListPanel from './EdgeListPanel.vue';

  const currentFrame = useCurrentFrame<PrimsFrame>();
  const excluded = computed(() => currentFrame.value?.excludedEdgeIds ?? []);
</script>

<template>
  <EdgeListPanel
    title="Excluded"
    :ids="excluded"
  />
</template>
