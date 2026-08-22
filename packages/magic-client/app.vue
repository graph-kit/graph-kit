<script setup lang="ts">
  import MagicToaster from '@magic/shared/Toaster';
</script>

<template>
  <div class="h-screen">
    <NuxtPage />
    <!-- one viewport for the whole app, so a toast outlives the page that raised it -->
    <ClientOnly><MagicToaster /></ClientOnly>
  </div>
</template>
