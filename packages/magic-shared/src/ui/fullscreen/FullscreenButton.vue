<script setup lang="ts">
  import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';
  import { useFullscreen } from '@vueuse/core';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import { menuItemClasses } from '../../components/dropdown/classes.ts';
  import Icon from '../../components/icon/Icon.vue';

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
  <Button
    @click="fullscreen.toggle"
    :disabled="
      fullscreen.isSupported.value
        ? undefined
        : 'This browser has no fullscreen mode'
    "
    :class="menuItemClasses"
  >
    <template #start>
      <Icon :path="content.icon" />
    </template>
    {{ content.text }}
  </Button>
</template>
