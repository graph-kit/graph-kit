<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Icon from '@magic/shared/Icon';
  import { mdiRestart } from '@mdi/js';

  import { useProvidedTreeActions } from './useProvidedTree.ts';

  const { resetTree } = useProvidedTreeActions();
</script>

<template>
  <Button
    @click="resetTree"
    class="hover:bg-red-600 active:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-700 hover:text-white"
  >
    <template #start>
      <Icon :path="mdiRestart" />
    </template>
    Reset Tree
  </Button>
</template>
