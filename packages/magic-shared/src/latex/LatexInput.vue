<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';

  import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

  import type { MathfieldElement } from './types.ts';

  // the wrapper owns the sizing, so attrs stay on the math-field where consumers expect them
  defineOptions({ inheritAttrs: false });

  // mathlive draws a 0.76em tall, 2px wide caret
  const CARET_HEIGHT = '0.86em';
  const CARET_WIDTH = '2px';

  /** these sit in the shadow root behind no part, so they are only reachable by adopting a stylesheet in */
  const restyleShadowRoot = (mathField: MathfieldElement) => {
    const { shadowRoot } = mathField;
    if (!shadowRoot) return;

    const styles = new CSSStyleSheet();
    styles.replaceSync(`
      .ML__caret::after,
      .ML__text-caret::after {
        height: ${CARET_HEIGHT};
        --_caret-width: ${CARET_WIDTH};
      }

      /* mathlive paints every focused text mode run, which reads as the placeholder being selected */
      .ML__content-placeholder .ML__text {
        background: transparent;
      }
    `);

    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, styles];
  };

  const props = withDefaults(
    defineProps<{
      width?: number;
      height?: number;
      /** latex shown while the field is empty */
      placeholder?: string;
      /** paints the field as rejecting what it currently holds */
      error?: boolean;
    }>(),
    { width: 400, height: 40, placeholder: '', error: false },
  );

  const emit = defineEmits<{
    /** math-live has loaded in the keyboard */
    ready: [mathfield: MathfieldElement];
  }>();

  const attrClass = useAttrClass();

  const latexString = defineModel<string>({
    required: true,
  });

  const classes = computed(() =>
    cn(
      'text-box h-full w-full rounded-md outline-none transition-colors',
      props.error
        ? 'bg-red-300'
        : 'bg-gray-100 hover:bg-white focus-within:bg-white',
      attrClass.value,
    ),
  );

  // mathlive renders the math at whatever font size it inherits, so scale it to the field
  const wrapperStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.height}px`,
    fontSize: `${props.height / 2}px`,
  }));

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
    restyleShadowRoot(mathField);
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
  <div :style="wrapperStyle">
    <math-field
      v-if="mathfieldRegistered"
      ref="latexInput"
      v-bind="{ ...$attrs, class: undefined }"
      :class="classes"
      :placeholder="placeholder"
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

  /* mathlive's placeholder gray is pitched at a white field, which leaves it washed out on the unfocused one */
  math-field::part(placeholder) {
    color: rgb(107, 114, 128);
  }

  /* mathlive sizes its container to the content and bottom aligns it, which leaves the math and the caret sitting low in the field */
  math-field::part(container) {
    height: 100%;
    min-height: 0;
    align-items: center;
  }

  math-field {
    --contains-highlight-background-color: rgb(200, 200, 200);
    --contains-highlight-color: rgb(45, 45, 45);
    cursor: text;
  }
</style>
