<script setup lang="ts">
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { KruskalsFrame, PrimsFrame } from '../frame.ts';
  import EdgeListPanel from './EdgeListPanel.vue';

  const currentFrame = useCurrentFrame<PrimsFrame | KruskalsFrame>();
  const considering = computed(() => currentFrame.value?.candidateEdges ?? []);
  const selected = computed(() => currentFrame.value?.selectedEdge);
</script>

<template>
  <EdgeListPanel
    title="In Consideration"
    :edgeIds="considering"
    :highlightId="selected"
  />
</template>
