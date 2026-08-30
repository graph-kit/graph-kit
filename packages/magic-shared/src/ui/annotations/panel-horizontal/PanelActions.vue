<script setup lang="ts">
  import { mdiBroom } from '@mdi/js';

  import Button from '../../../components/button/Button.vue';
  import Icon from '../../../components/icon/Icon.vue';
  import { useClearAnnotations } from '../panel-shared/useClearAnnotations.ts';

  const { clear, disabledReason } = useClearAnnotations();
</script>

<template>
  <Button
    @click="clear"
    label="Clear Annotations"
    :disabled="disabledReason"
  >
    <template #start>
      <Icon :path="mdiBroom" />
    </template>
    Clear Annotations</Button
  >
</template>
