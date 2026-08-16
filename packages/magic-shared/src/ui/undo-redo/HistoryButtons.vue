<script lang="ts" setup>
  import { mdiRedo, mdiUndo } from '@mdi/js';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();
</script>

<template>
  <HStack v-if="magic.history">
    <IconButton
      @click="magic.history.undo"
      :disabled="magic.history.canUndo.value ? undefined : 'Nothing to undo'"
      class="p-4"
      label="Undo"
      :size="20"
      :path="mdiUndo"
    />
    <IconButton
      @click="magic.history.redo"
      :disabled="magic.history.canRedo.value ? undefined : 'Nothing to redo'"
      class="p-4"
      label="Redo"
      :size="20"
      :path="mdiRedo"
    />
  </HStack>
</template>
