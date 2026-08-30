<script setup lang="ts">
  import Button from '../../components/button/Button.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';

  const shell = useProvidedShell();
</script>

<template>
  <Well
    class="p-0"
    v-if="shell.jumpToContent?.isContentOffscreen.value"
  >
    <Button
      @click="shell.jumpToContent.jump"
      class="bg-transparent dark:bg-transparent"
    >
      Back to Content
    </Button>
  </Well>
</template>
