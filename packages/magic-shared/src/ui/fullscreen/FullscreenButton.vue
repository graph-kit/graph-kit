<script setup lang="ts">
  import { mdiFullscreen, mdiFullscreenExit } from '@mdi/js';
  import { useFullscreen } from '@vueuse/core';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
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
    class="px-2 bg-transparent dark:bg-transparent dark:hover:bg-transparent w-full justify-start"
    @click="fullscreen.toggle"
    :disabled="!fullscreen.isSupported.value"
  >
    <template #start>
      <Icon :path="content.icon" />
    </template>
    {{ content.text }}
  </Button>
</template>
