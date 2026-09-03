<script setup lang="ts">
  import Button from '../../components/button/Button.vue';
  import Dialog from '../../components/dialog/Dialog.vue';
  import HStack from '../../components/layout/HStack.vue';
  import { DialogAction } from './types.ts';
  import { useShellDialog } from './useShellDialog.ts';

  const dialog = useShellDialog();

  const close = () => {
    const open = dialog.entry.value;
    if (open) dialog.close(open.id);
  };

  const onOpenChanged = (isOpen: boolean) => {
    if (!isOpen) close();
  };

  const take = (action: DialogAction) => {
    action.onClick?.();
    close();
  };
</script>

<template>
  <Dialog
    v-if="dialog.entry.value"
    class="flex flex-col gap-2 p-6"
    :title="dialog.entry.value.title"
    :open="true"
    @update:open="onOpenChanged"
  >
    <p
      v-if="dialog.entry.value.description"
      class="opacity-80"
    >
      {{ dialog.entry.value.description }}
    </p>

    <HStack
      v-if="dialog.entry.value.actions?.length"
      class="justify-end mt-4"
    >
      <Button
        v-for="action of dialog.entry.value.actions"
        :key="action.textContent"
        class="px-3 py-1"
        :href="action.href"
        @click="take(action)"
      >
        {{ action.textContent }}
      </Button>
    </HStack>
  </Dialog>
</template>
