<script setup lang="ts">
import "mathlive";
import { ref, onMounted, onUnmounted } from "vue";
import type { MathfieldElement } from "mathlive";

const props = defineProps<{
  hotkeys: Record<string, string>;
}>();

const latexString = defineModel<string>({
  required: true,
});

const insertIntoLatexString = (latex: string) => {
  if (!latexInput.value) return;
  latexInput.value.executeCommand(["insert", latex]);
};

const replaceLatexString = (latex: string) => {
  if (!latexInput.value) return;
  latexInput.value.value = latex;
  latexString.value = latex;
};

defineExpose({ insertIntoLatexString, replaceLatexString })

const latexInput = ref<MathfieldElement | null>(null);

const onInput = () => {
  if (!latexInput.value) return;
  latexString.value = latexInput.value.getValue();
};

const onKeydown = (event: KeyboardEvent) => {
  
  const keyEvent = event;
  const isAlphabetical = /^[a-zA-Z]$/.test(keyEvent.key);

  if (keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.altKey) return;
  if (keyEvent.key.length !== 1) return;
  if (!isAlphabetical) return
  if (keyEvent.key in props.hotkeys) return;
  
  keyEvent.preventDefault();
  latexInput.value!.executeCommand(["insert", keyEvent.key.toUpperCase()]);
};

onMounted(() => {
  const mathField = latexInput.value;

  if (!mathField) return;

    mathField.inlineShortcuts = {
      ...mathField.inlineShortcuts,
      ...props.hotkeys,
    }

  mathField.addEventListener("input", onInput);
  mathField.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  const mathField = latexInput.value;

  if (!mathField) return;

  mathField.removeEventListener("input", onInput);
  mathField.removeEventListener("keydown", onKeydown);
});
</script>

<template>
   <math-field
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