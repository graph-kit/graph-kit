<script setup lang="ts">
import LatexInput from "./latex-input/LatexInput.vue";
import type { LatexInputInstance } from "./latex-input/types.ts";
import { ref, computed } from "vue";

const props = defineProps<{
  modelValue: string;
  hidden: boolean;
  error: boolean;
  simplified: string | null;
  disambiguated: string | null;
  color: string;
  hotkeys: Record<string, string>;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:hidden": [hidden: boolean];
  focus: [];
}>();

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const latexInputRef = ref<LatexInputInstance | null>(null);

const insertIntoLatexString = (symbol: string) => {
  latexInputRef.value?.insertIntoLatexString(symbol);
};

defineExpose({ insertIntoLatexString });

const applySimplification = () => {
  if (!props.simplified) return;
  emit("update:modelValue", props.simplified);
  latexInputRef.value?.replaceLatexString(props.simplified);
};

const applyDisambiguation = () => {
  if (!props.disambiguated) return;

  emit("update:modelValue", props.disambiguated);
  latexInputRef.value?.replaceLatexString(props.disambiguated);
};
</script>

<template>
  <div class="flex items-center gap-2 mb-2">
    <LatexInput
      ref="latexInputRef"
      v-model="localValue"
      :hotkeys="hotkeys"
      :class="['rounded-md', error ? 'bg-red-50 ring-2 ring-red-400' : 'bg-white']"
      @focus="emit('focus')"
    />
    <button
      v-if="disambiguated && !error"
      :title="`Ambiguous order of operations. Parsed as: ${disambiguated}`"
      class="flex-none w-8 h-8 rounded-md bg-gray-500 text-white flex items-center justify-center select-none"
      @click="applyDisambiguation"
    >&#9432;</button>

    <button
      v-if="simplified && !error"
      @click="applySimplification"
      title="Simplify expression"
      class="text-white text-xs px-2 h-8 rounded-md flex-none bg-gray-500 hover:bg-gray-400 whitespace-nowrap"
    >simplify</button>
    <button
      @click="emit('update:hidden', !hidden)"
      :style="{ backgroundColor: hidden ? 'gray' : color }"
      class="w-2 h-8 rounded-full flex-none"
    ></button>
  </div>
</template>
