<script setup lang="ts">
  import {
    mdiBroom,
    mdiDelete,
    mdiDeleteOutline,
    mdiTrashCan,
    mdiUndoVariant,
  } from '@mdi/js';

  import { computed } from 'vue';

  import Button from '../../../components/button/Button.vue';
  import Icon from '../../../components/icon/Icon.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  const controls = useAnnotationControls();

  const disabledReason = computed(() =>
    controls.annotations.value.length === 0
      ? 'Nothing has been drawn yet'
      : false,
  );
</script>

<template>
  <Button
    class="grow p-3 hover:bg-red-500 hover:text-white active:bg-red-500 dark:bg-red-500 bg-red-500 dark:hover:bg-red-500 dark:active:bg-red-500"
    :path="mdiTrashCan"
    :size="28"
    label="Remove All Annotations"
    :disabled="disabledReason"
    @click="controls.clear()"
  >
    <template #start>
      <Icon :path="mdiDelete" />
    </template>
    Erase All</Button
  >
</template>
