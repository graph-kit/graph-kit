<script setup lang="ts">
  import MainView from '@magic/products/dev/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['dev'].meta);
</script>

<template>
  <div><MainView /></div>
</template>
