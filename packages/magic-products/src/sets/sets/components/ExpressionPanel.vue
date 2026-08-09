<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';

  import { ref } from 'vue';

  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { useExpressionAnalysis } from '../composables/useExpressionAnalysis.ts';
  import {
    ADDITIONAL_KEY_BINDINGS,
    COLORS,
    KEYBOARD_KEY_TO_LATEX,
  } from '../other/constants.ts';
  import ExpressionRow from './ExpressionRow.vue';
  import LatexButton from './LatexButton.vue';

  const { allSections, activeSubsets } = useProvidedSetsProductState();

  const rowRefs = ref<InstanceType<typeof ExpressionRow>[]>([]);
  const setRowRef = (el: unknown, index: number) => {
    if (el) rowRefs.value[index] = el as InstanceType<typeof ExpressionRow>;
  };

  const latexInputStrings = ref<{ value: string; hidden: boolean }[]>([
    { value: '', hidden: false },
  ]);
  const focusedIndex = ref(0);

  const insertLatexString = (symbol: string) => {
    rowRefs.value[focusedIndex.value]?.insertIntoLatexString(symbol);
  };

  const addInput = () => {
    latexInputStrings.value.push({ value: '', hidden: false });
    focusedIndex.value = latexInputStrings.value.length - 1;
  };

  const { inputErrors, simplifiedForms, disambiguatedForms } =
    useExpressionAnalysis(latexInputStrings, allSections);
</script>

<template>
  <Well>
    <VStack>
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
        :hotkeys="{ ...KEYBOARD_KEY_TO_LATEX, ...ADDITIONAL_KEY_BINDINGS }"
        @focus="focusedIndex = index"
      />

      <div>
        <Button
          @click="addInput"
          :disabled="latexInputStrings.length > 5"
        >
          + Add Expression
        </Button>
      </div>

      <HStack>
        <LatexButton
          v-for="latexString in KEYBOARD_KEY_TO_LATEX"
          @click="insertLatexString(latexString)"
        >
          {{ latexString }}
        </LatexButton>
      </HStack>
    </VStack>
  </Well>
</template>
