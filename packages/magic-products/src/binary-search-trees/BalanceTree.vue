<script setup lang="ts">
  import DisabledLensButton from '@magic/shared/DisabledLensButton';
  import Icon from '@magic/shared/Icon';
  import { mdiPlay } from '@mdi/js';

  import { useProvidedTreeActions } from './useProvidedTree.ts';

  const { balanceTree } = useProvidedTreeActions();
</script>

<template>
  <DisabledLensButton @click="balanceTree">
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    Balance Tree
  </DisabledLensButton>
</template>
