<script setup lang="ts">
  import { computed } from 'vue';

  import { useProvidedMagic } from '../product/context.ts';

  const props = withDefaults(
    defineProps<{
      slotId: string;
      unstyled?: boolean;
    }>(),
    {
      unstyled: false,
    },
  );

  const magic = useProvidedMagic();

  const highlighted = computed(
    () => props.slotId === magic.componentSlots.highlightedId.value,
  );

  const classes = computed(() => {
    if (highlighted.value) {
      return 'border-4 border-red-500 rounded-md';
    } else {
      return 'border-4 border-transparent rounded-md';
    }
  });

  const displayClasses = computed(() => {
    if (props.unstyled) return;
    return classes.value;
  });
</script>

<template>
  <div :class="displayClasses">
    <slot
      :highlighted="highlighted"
      :classes="classes"
    ></slot>
  </div>
</template>
