<script setup lang="ts">
  import { DropdownMenuItem } from 'reka-ui';

  import { useAttrs } from 'vue';

  defineOptions({ inheritAttrs: false });

  const attrs = useAttrs();
</script>

<template>
  <!--
    as-child makes the item and its child one element, so anything styled here would be
    styling the consumer's element. behaviour only: role, keyboard nav, data-highlighted
    and select-to-close. what a row looks like belongs to whatever is slotted in
  -->
  <DropdownMenuItem
    as-child
    v-bind="attrs"
  >
    <slot />
  </DropdownMenuItem>
</template>
