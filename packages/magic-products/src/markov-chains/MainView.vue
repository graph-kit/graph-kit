<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-product';

  const graph = useGraphShell({
    productId: 'markov-chains',
  });
</script>

<template>
  <Shell />
</template>
