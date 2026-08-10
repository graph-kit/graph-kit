<script setup lang="ts">
  import MainView from '@magic/products/sets/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['sets'].meta);
</script>

<template>
  <MainView />
</template>
