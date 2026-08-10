<script setup lang="ts">
  import MainView from '@magic/products/traversals/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['traversals'].meta);
</script>

<template>
  <div><MainView /></div>
</template>
