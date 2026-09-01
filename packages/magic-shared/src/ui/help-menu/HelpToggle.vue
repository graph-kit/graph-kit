<script setup lang="ts">
  import { mdiHelp } from '@mdi/js';

  import Dialog from '../../components/dialog/Dialog.vue';
  import IconButton from '../../components/icon-button/IconButton.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import HelpMenuContent from './HelpMenuContent.vue';

  const { helpMenu } = useProvidedShell();
</script>

<template>
  <Well class="p-0 rounded-full overflow-hidden">
    <Dialog
      class="max-w-md"
      title="Help"
      :show-header="false"
      :open="helpMenu.isOpen.value"
      @update:open="helpMenu.setOpen"
    >
      <Well class="py-4 px-6">
        <HelpMenuContent />
      </Well>

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
