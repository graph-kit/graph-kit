<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import { lensChips } from './lensChips.ts';

  // sims: step 0 through n of matrix multiplications

  const graph = useGraphShell({
    productId: 'markov-chains',
    lensChips,
  });
</script>

<template>
  <Shell />
</template>
