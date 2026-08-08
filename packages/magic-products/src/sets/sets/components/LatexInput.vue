<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, ref } from 'vue';

  /**
   * the slice of mathlive's MathfieldElement this component drives, declared here
   * because mathlive's node entry omits the class and nodenext resolves to that entry.
   */
  type MathfieldElement = HTMLElement & {
    value: string;
    inlineShortcuts: Record<string, string>;
    getValue: () => string;
    executeCommand: (command: [string, string]) => void;
  };

  const props = defineProps<{
    hotkeys: Record<string, string>;
  }>();

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

  const onKeydown = (event: KeyboardEvent) => {
    const isAlphabetical = /^[a-zA-Z]$/.test(event.key);

    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    if (!isAlphabetical) return;
    if (event.key in props.hotkeys) return;

    event.preventDefault();
    latexInput.value?.executeCommand(['insert', event.key.toUpperCase()]);
  };

  onMounted(async () => {
    // importing mathlive registers <math-field> against window, so it can only run in the browser
    await import('mathlive');
    mathfieldRegistered.value = true;
    await nextTick();

    const mathField = latexInput.value;
    if (!mathField) return;

    mathField.inlineShortcuts = {
      ...mathField.inlineShortcuts,
      ...props.hotkeys,
    };

    mathField.addEventListener('input', onInput);
    mathField.addEventListener('keydown', onKeydown);
  });

  onUnmounted(() => {
    const mathField = latexInput.value;
    if (!mathField) return;

    mathField.removeEventListener('input', onInput);
    mathField.removeEventListener('keydown', onKeydown);
  });
</script>

<template>
  <math-field
    v-if="mathfieldRegistered"
    ref="latexInput"
    class="text-box"
  />
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
    min-height: 2.1em;
    --contains-highlight-background-color: rgb(200, 200, 200);
    --contains-highlight-color: rgb(45, 45, 45);
  }
</style>
