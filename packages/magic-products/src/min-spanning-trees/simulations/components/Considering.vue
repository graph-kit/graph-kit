<script setup lang="ts">
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { PrimsFrame } from '../frame.ts';
  import EdgeListPanel from './EdgeListPanel.vue';

  const currentFrame = useCurrentFrame<PrimsFrame>();
  const considering = computed(() => currentFrame.value?.candidateEdges ?? []);
</script>

<template>
  <EdgeListPanel
    title="In Consideration"
    :ids="considering"
  />
</template>
