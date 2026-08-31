<script setup lang="ts">
  import { mdiHelp } from '@mdi/js';

  import Dialog from '../../components/dialog/Dialog.vue';
  import IconButton from '../../components/icon-button/IconButton.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import HelpMenuContent from './HelpMenuContent.vue';

  // the shell owns the dialog's state so the "h" shortcut can reach it from anywhere
  const { helpMenu } = useProvidedShell();
</script>

<template>
  <Well class="p-0 rounded-full overflow-hidden">
    <Dialog
      class="max-w-lg"
      title="Help"
      :open="helpMenu.isOpen.value"
      @update:open="helpMenu.setOpen"
    >
      <HelpMenuContent class="mt-4" />

      <template #trigger>
        <IconButton
          class="bg-transparent dark:bg-transparent p-4"
          label="Help (h)"
          :path="mdiHelp"
          :size="20"
        />
      </template>
    </Dialog>
  </Well>
</template>
