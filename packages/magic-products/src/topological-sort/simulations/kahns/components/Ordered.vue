<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { KahnsFrame } from '../frame.ts';

  const currentFrame = useCurrentFrame<KahnsFrame>();
  const ordered = computed(() => currentFrame.value?.orderedNodeIds ?? []);
</script>

<template>
  <NodeList
    :ids="ordered"
    title="Order"
    exit-side="left"
  />
</template>
