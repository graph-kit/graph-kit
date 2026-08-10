<script setup lang="ts">
  import MainView from '@magic/products/markov-chains/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['markov-chains'].meta);
</script>

<template>
  <div><MainView /></div>
</template>
