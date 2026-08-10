<script setup lang="ts">
  import { MagicProduct, useGraphProduct } from '@magic/shared/product';

  const graph = useGraphProduct({
    productId: 'markov-chains',
  });
</script>

<template>
  <MagicProduct />
</template>
