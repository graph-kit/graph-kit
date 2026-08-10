<script setup lang="ts">
  import MainView from '@magic/products/basic-trees/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['avl-trees'].meta);
</script>

<template>
  <div><MainView /></div>
</template>
