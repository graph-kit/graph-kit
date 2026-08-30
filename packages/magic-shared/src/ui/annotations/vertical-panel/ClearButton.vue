<script setup lang="ts">
  import { mdiBroom } from '@mdi/js';

  import IconButton from '../../../components/icon-button/IconButton.vue';
  import { useClearAnnotations } from '../panel-shared/useClearAnnotations.ts';
  import { spotShape } from './classes.ts';

  const { clear, disabledReason } = useClearAnnotations();
</script>

<template>
  <IconButton
    :class="spotShape"
    :path="mdiBroom"
    :size="22"
    label="Clear Annotations"
    :disabled="disabledReason"
    side="right"
    @click="clear"
  />
</template>
