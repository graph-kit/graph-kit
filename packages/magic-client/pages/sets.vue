<script setup lang="ts">
  import MainView from '@magic/products/sets/MainView.vue';
  import OldMainView from '@magic/products/sets/OldMainView.vue';
  import { manifests } from '@magic/shared/product';

  useSeoMeta(manifests['sets'].meta);
</script>

<template>
  <OldMainView />
</template>
