<script lang="ts" setup>
  import { mdiRedo, mdiUndo } from '@mdi/js';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();
</script>

<template>
  <Well
    v-if="magic.history"
    class="p-0 rounded-full overflow-hidden"
  >
    <HStack gap="0">
      <IconButton
        @click="magic.history.undo"
        :disabled="magic.history.canUndo.value ? undefined : 'Nothing to undo'"
        class="p-3 pl-5 bg-transparent dark:bg-transparent rounded-r-none"
        label="Undo (cmd + z)"
        :size="20"
        :path="mdiUndo"
      />
      <div class="w-px self-stretch my-2 bg-gray-300 dark:bg-gray-700" />
      <IconButton
        @click="magic.history.redo"
        :disabled="magic.history.canRedo.value ? undefined : 'Nothing to redo'"
        class="p-3 pr-5 bg-transparent dark:bg-transparent rounded-l-none"
        label="Redo (cmd + shift + z)"
        :size="20"
        :path="mdiRedo"
      />
    </HStack>
  </Well>
</template>
