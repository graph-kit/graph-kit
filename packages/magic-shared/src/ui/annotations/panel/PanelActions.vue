<script setup lang="ts">
  import { mdiBroom } from '@mdi/js';

  import { computed } from 'vue';

  import Button from '../../../components/button/Button.vue';
  import Icon from '../../../components/icon/Icon.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  const { annotations, clear } = useAnnotationControls();

  const disabledReason = computed(() =>
    annotations.value.length === 0 ? 'Nothing to clear yet' : false,
  );
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
