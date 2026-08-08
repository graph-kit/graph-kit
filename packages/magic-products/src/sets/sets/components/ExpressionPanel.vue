<script setup lang="ts">
  import { ref, toRef, watch } from 'vue';

  import { useExpressionAnalysis } from '../composables/useExpressionAnalysis.ts';
  import {
    ADDITIONAL_KEY_BINDINGS,
    COLORS,
    KEY_TO_LATEX,
  } from '../other/constants.ts';
  import type { CircleLabel, HighlightGroup } from '../types/types.ts';
  import ExpressionRow from './ExpressionRow.vue';
  import LatexButtons from './LatexButtons.vue';

  const props = defineProps<{
    allSections: CircleLabel[][];
  }>();

  const emit = defineEmits<{
    'update:activeSubsets': [subsets: HighlightGroup[]];
  }>();

  const rowRefs = ref<InstanceType<typeof ExpressionRow>[]>([]);
  const setRowRef = (el: unknown, index: number) => {
    if (el) rowRefs.value[index] = el as InstanceType<typeof ExpressionRow>;
  };

  const latexInputStrings = ref<{ value: string; hidden: boolean }[]>([
    { value: '', hidden: false },
  ]);
  const focusedIndex = ref(0);

  const insertLatexSymbol = (symbol: string) => {
    rowRefs.value[focusedIndex.value]?.insertIntoLatexString(symbol);
  };

  const addInput = () => {
    latexInputStrings.value.push({ value: '', hidden: false });
    focusedIndex.value = latexInputStrings.value.length - 1;
  };

  const { inputErrors, simplifiedForms, disambiguatedForms, activeSubsets } =
    useExpressionAnalysis(latexInputStrings, toRef(props, 'allSections'));

  watch(activeSubsets, (val) => emit('update:activeSubsets', val), {
    immediate: true,
  });
</script>

<template>
  <div
    style="position: absolute; bottom: 0; z-index: 2"
    class="flex justify-center items-center w-screen"
  >
    <div class="bg-gray-600 p-5 w-125 rounded-t-lg">
      <ExpressionRow
        v-for="(_, index) in latexInputStrings"
        :key="index"
        :ref="(el) => setRowRef(el, index)"
        v-model="latexInputStrings[index].value"
        v-model:hidden="latexInputStrings[index].hidden"
        :error="inputErrors[index]"
        :simplified="simplifiedForms[index]"
        :disambiguated="disambiguatedForms[index]"
        :color="COLORS.HIGHLIGHT[index % COLORS.HIGHLIGHT.length]"
        :hotkeys="{ ...KEY_TO_LATEX, ...ADDITIONAL_KEY_BINDINGS }"
        @focus="focusedIndex = index"
      />

      <button
        @click="addInput"
        :disabled="latexInputStrings.length > 5"
        class="text-white text-sm mb-2 opacity-60 hover:opacity-100"
      >
        + add expression
      </button>

      <LatexButtons
        :keys="KEY_TO_LATEX"
        @insert="insertLatexSymbol"
      />
    </div>
  </div>
</template>
