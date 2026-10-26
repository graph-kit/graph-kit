<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import { lensChips } from './lensChips.ts';

  useGraphShell({
    productId: 'topological-sort',
    core: {
      weighted: false,
    },
    interactive: {
      allowSelfLoops: false,
    },
    lensChips,
  });
</script>

<template>
  <Shell />
</template>
