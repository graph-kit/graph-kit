<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';

  import { computed, ref, watch } from 'vue';

  import LatexInput from './LatexInput.vue';
  import type { LatexInputInstance, MathfieldElement } from './types.ts';

  // the inner input owns the sizing and the attrs, so nothing lands on a wrapper element here
  defineOptions({ inheritAttrs: false });

  const props = withDefaults(
    defineProps<{
      /**
       * shown in place of the model value, holding the field inert for as long as it is set.
       * an empty string previews an empty field, so only undefined reads as previewing nothing
       */
      previewValue?: string;
      /** paints the field as rejecting what it currently holds, ignored while previewing */
      error?: boolean;
      width?: number;
      height?: number;
      placeholder?: string;
    }>(),
    { error: false },
  );

  const emit = defineEmits<{
    /** math-live has loaded in the keyboard */
    mounted: [mathfield: MathfieldElement];
    unmounted: [];
  }>();

  const latexString = defineModel<string>({
    required: true,
  });

  const attrClass = useAttrClass();

  const latexInput = ref<LatexInputInstance | null>(null);
  const mathfield = ref<MathfieldElement | null>(null);

  const inPreview = computed(() => props.previewValue !== undefined);

  const classes = computed(() =>
    cn(inPreview.value && 'pointer-events-none bg-blue-200', attrClass.value),
  );

  /**
   * what the field is currently showing, which is the preview rather than the
   * model value while one is set, so it only writes back outside of preview
   */
  const displayedString = ref(latexString.value);

  watch(displayedString, (latex) => {
    if (inPreview.value) return;
    latexString.value = latex;
  });

  // a rewrite arriving from the model, which the preview outranks until it is cleared
  watch(latexString, (latex) => {
    if (inPreview.value) return;
    displayedString.value = latex;
  });

  const showCurrentValue = () => {
    latexInput.value?.replaceLatexString(
      props.previewValue ?? latexString.value,
    );
  };

  watch(
    () => props.previewValue,
    () => {
      showCurrentValue();
      // the field may already have been focused when the preview arrived
      mathfield.value?.blur();
    },
  );

  const onMounted = (field: MathfieldElement) => {
    mathfield.value = field;
    showCurrentValue();
    emit('mounted', field);
  };
</script>

<template>
  <!-- an empty preview is a value in its own right, so it drops the placeholder that would read as an empty field -->
  <LatexInput
    ref="latexInput"
    v-bind="{ ...$attrs, class: undefined }"
    v-model="displayedString"
    :class="classes"
    :error="inPreview ? false : error"
    :width="width"
    :height="height"
    :read-only="inPreview || undefined"
    :placeholder="inPreview ? '' : placeholder"
    :tabindex="inPreview ? -1 : undefined"
    @mounted="onMounted"
    @unmounted="emit('unmounted')"
  />
</template>
