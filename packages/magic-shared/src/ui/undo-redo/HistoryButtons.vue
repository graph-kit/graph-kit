<script lang="ts" setup>
  import { mdiRedo, mdiUndo } from '@mdi/js';

  import { computed } from 'vue';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';

  const shell = useProvidedShell();

  const reason = (canRun: boolean | undefined, whenEmpty: string) =>
    shell.history?.suppression.value ?? (canRun ? undefined : whenEmpty);

  const undoDisabled = computed(() =>
    reason(shell.history?.canUndo.value, 'Nothing to undo'),
  );

  const redoDisabled = computed(() =>
    reason(shell.history?.canRedo.value, 'Nothing to redo'),
  );
</script>

<template>
  <Well
    v-if="shell.history"
    class="p-0 rounded-full overflow-hidden"
  >
    <HStack gap="0">
      <IconButton
        @click="shell.history.undo"
        :disabled="undoDisabled"
        class="p-3 pl-5 bg-transparent dark:bg-transparent rounded-r-none"
        label="Undo (cmd + z)"
        :size="20"
        :path="mdiUndo"
      />
      <div class="w-px self-stretch my-2 bg-gray-300 dark:bg-gray-700" />
      <IconButton
        @click="shell.history.redo"
        :disabled="redoDisabled"
        class="p-3 pr-5 bg-transparent dark:bg-transparent rounded-l-none"
        label="Redo (cmd + shift + z)"
        :size="20"
        :path="mdiRedo"
      />
    </HStack>
  </Well>
</template>
