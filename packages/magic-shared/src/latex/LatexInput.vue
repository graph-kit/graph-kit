<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';

  import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

  import type { MathfieldElement } from './types.ts';

  // the wrapper owns the sizing, so attrs stay on the math-field where consumers expect them
  defineOptions({ inheritAttrs: false });

  const props = withDefaults(
    defineProps<{
      width?: number;
      height?: number;
      /** paints the field as rejecting what it currently holds */
      error?: boolean;
    }>(),
    { width: 400, height: 40, error: false },
  );

  const emit = defineEmits<{
    /** math-live has loaded in the keyboard */
    ready: [mathfield: MathfieldElement];
  }>();

  const attrClass = useAttrClass();

  const classes = computed(() =>
    cn(
      'text-box h-full w-full rounded-md outline-none',
      props.error ? 'bg-red-300' : 'bg-white',
      attrClass.value,
    ),
  );

  const latexString = defineModel<string>({
    required: true,
  });

  const latexInput = ref<MathfieldElement | null>(null);
  const mathfieldRegistered = ref(false);

  const insertIntoLatexString = (latex: string) => {
    if (!latexInput.value) return;
    latexInput.value.executeCommand(['insert', latex]);
  };

  const replaceLatexString = (latex: string) => {
    if (!latexInput.value) return;
    latexInput.value.value = latex;
    latexString.value = latex;
  };

  defineExpose({ insertIntoLatexString, replaceLatexString });

  const onInput = () => {
    if (!latexInput.value) return;
    latexString.value = latexInput.value.getValue();
  };

  onMounted(async () => {
    // importing mathlive registers <math-field> against window, so it can only run in the browser
    await import('mathlive');
    mathfieldRegistered.value = true;
    await nextTick();

    const mathField = latexInput.value;
    if (!mathField) return;

    mathField.addEventListener('input', onInput);
    emit('ready', mathField);
  });

  onUnmounted(() => {
    const mathField = latexInput.value;
    if (!mathField) return;

    mathField.removeEventListener('input', onInput);
  });
</script>

<template>
  <!-- mathlive only loads in the browser, so hold the space it will occupy to avoid a layout shift -->
  <div :style="{ width: `${width}px`, height: `${height}px` }">
    <math-field
      v-if="mathfieldRegistered"
      ref="latexInput"
      v-bind="{ ...$attrs, class: undefined }"
      :class="classes"
    />
  </div>
</template>

<style scoped>
  @media not (pointer: coarse) {
    math-field::part(virtual-keyboard-toggle) {
      display: none;
    }
  }

  math-field::part(menu-toggle) {
    display: none;
  }

  math-field {
    --contains-highlight-background-color: rgb(200, 200, 200);
    --contains-highlight-color: rgb(45, 45, 45);
  }
</style>
