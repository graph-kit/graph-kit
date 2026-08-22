<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  useGraphProduct({
    productId: 'markov-chains',
  });
</script>

<template>
  <MagicProduct />
</template>
