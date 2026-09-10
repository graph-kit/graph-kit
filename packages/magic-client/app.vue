<script setup lang="ts">
  import MagicToaster from '@magic/shared/Toaster';
  import TouchDeviceView from '@magic/shared/TouchDeviceView';
  import { useUserAgent } from '@magic/shared/user-agent';

  const { isTouchOnly } = useUserAgent();
</script>

<template>
  <div class="h-screen">
    <TouchDeviceView v-if="isTouchOnly" />
    <NuxtPage v-else />
    <ClientOnly><MagicToaster /></ClientOnly>
  </div>
</template>
