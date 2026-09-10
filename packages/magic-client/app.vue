<script setup lang="ts">
  import MagicToaster from '@magic/shared/Toaster';
  import TouchDeviceView from '@magic/shared/TouchDeviceView';
  import { useUserAgent } from '@magic/shared/user-agent';

  // none of the app's interactions have a touch equivalent yet, so a device with no
  // pointer gets a page about the app rather than a canvas it cannot drive
  const { isTouchOnly } = useUserAgent();
</script>

<template>
  <div class="h-screen">
    <TouchDeviceView v-if="isTouchOnly" />
    <NuxtPage v-else />
    <!-- one viewport for the whole app, so a toast outlives the page that raised it -->
    <ClientOnly><MagicToaster /></ClientOnly>
  </div>
</template>
