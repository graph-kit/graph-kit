<script setup lang="ts">
  import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';
  import { useFullscreen } from '@vueuse/core';

  import { computed } from 'vue';

  import MenuItem from '../../components/dropdown/MenuItem.vue';

  const fullscreen = useFullscreen();

  const content = computed(() => {
    if (!fullscreen.isSupported.value)
      return {
        icon: mdiFullscreen,
        text: 'Not Supported',
      };
    if (fullscreen.isFullscreen.value)
      return {
        icon: mdiFullscreenExit,
        text: 'Exit Fullscreen',
      };
    return {
      icon: mdiFullscreen,
      text: 'Fullscreen',
    };
  });
</script>

<template>
  <MenuItem
    @click="fullscreen.toggle"
    :disabled="
      fullscreen.isSupported.value
        ? undefined
        : 'This browser has no fullscreen mode'
    "
    :icon="content.icon"
  >
    {{ content.text }}
  </MenuItem>
</template>
