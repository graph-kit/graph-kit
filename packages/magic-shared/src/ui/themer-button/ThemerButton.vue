<script setup lang="ts">
  import { computed, onUnmounted, ref, watch } from 'vue';

  import Button from '../../components/button/Button.vue';
  import { Themer } from '../../theme/index.ts';

  interface Props {
    /** applied while the button is hovered or focused, so the canvas previews what pressing it does */
    themer: Pick<Themer, 'activate' | 'deactivate'>;
    // redeclared rather than left to fall through, so a call site that disables a button
    // without saying why is a type error instead of a silent boolean
    disabled?: boolean | string;
  }

  const props = defineProps<Props>();

  defineSlots<{
    default: () => unknown;
    start?: () => unknown;
    end?: () => unknown;
  }>();

  // tracked apart so a pointer leaving a still-focused button keeps the preview up
  const hovered = ref(false);
  const focused = ref(false);

  const previewedThemer = computed(() => {
    if (props.disabled) return;
    if (!hovered.value && !focused.value) return;
    return props.themer;
  });

  // watching the resolved themer rather than the pointer pairs every activate with exactly one
  // deactivate: overlapping hover and focus resolve to the same themer and never re-trigger, and
  // a themer swapped under the pointer takes the previous one off
  watch(previewedThemer, (newThemer, oldThemer) => {
    oldThemer?.deactivate();
    newThemer?.activate();
  });

  onUnmounted(() => previewedThemer.value?.deactivate());
</script>

<template>
  <Button
    :disabled="disabled"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @focus="focused = true"
    @blur="focused = false"
  >
    <template #start><slot name="start" /></template>
    <slot />
    <template #end><slot name="end" /></template>
  </Button>
</template>
