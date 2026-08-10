<script setup lang="ts">
  import MainView from '@magic/products/welcome/MainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['welcome'].meta);
</script>

<template>
  <div><MainView /></div>
</template>
