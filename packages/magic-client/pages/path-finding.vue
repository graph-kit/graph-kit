<script setup lang="ts">
  import MainView from '@magic/products/path-finding/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['path-finding'].meta);
</script>

<template>
  <div><MainView /></div>
</template>
