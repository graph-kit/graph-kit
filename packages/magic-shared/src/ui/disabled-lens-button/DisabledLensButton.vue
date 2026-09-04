<script setup lang="ts">
  import { computed, onUnmounted, ref, watch } from 'vue';

  import Button from '../../components/button/Button.vue';
  import { DisabledLens } from '../../lens/types.ts';
  import { useProvidedShell } from '../../product/context.ts';

  // redeclared rather than left to the button underneath, so what disables this one
  // brings the lens that shows the reason on the canvas along with the words
  interface Props {
    disabled?: DisabledLens | false;
    /** renders as a real link, so the browser owns the navigation rather than a handler */
    href?: string;
  }

  const props = defineProps<Props>();

  defineSlots<{
    default: () => unknown;
    start?: () => unknown;
    end?: () => unknown;
  }>();

  const shell = useProvidedShell();

  /** true while the pointer is on the button, or it holds focus */
  const pointedAt = ref(false);

  const previewedLens = computed(() => {
    if (!pointedAt.value || !props.disabled) return;
    return props.disabled.lens;
  });

  // watching the resolved lens rather than the pointer, so the lens taken off is always
  // the one that went on, even when the reason changed under the pointer
  watch(previewedLens, (newLens, oldLens) => {
    if (oldLens) shell.lens.remove(oldLens.id);
    if (newLens) shell.lens.add(newLens);
  });

  onUnmounted(() => {
    if (previewedLens.value) shell.lens.remove(previewedLens.value.id);
  });
</script>

<template>
  <!-- a reason-less disabled state still disables, it just has nothing to say about it -->
  <Button
    :disabled="disabled ? (disabled.reason ?? true) : false"
    :href="href"
    @pointerenter="pointedAt = true"
    @pointerleave="pointedAt = false"
    @focus="pointedAt = true"
    @blur="pointedAt = false"
  >
    <template #start><slot name="start" /></template>
    <slot />
    <template #end><slot name="end" /></template>
  </Button>
</template>
