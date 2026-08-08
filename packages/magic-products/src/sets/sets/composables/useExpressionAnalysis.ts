import { computed, type Ref } from "vue";
import type { CircleLabel, HighlightGroup } from "../types/types.ts";
import { setParser } from "../other/expressionParser.ts";
import { parseMathJSON } from "../other/parseMathJSON.ts";
import { simplify } from "../other/simplifier/index.ts";
import { extractVariables } from "../other/simplifier/truthTable.ts";
import { isAmbiguous, getDisambiguatedLatex } from "../other/disambiguate.ts";
import { COLORS } from "../other/constants.ts";

export type ExpressionInput = {
  value: string;
  hidden: boolean;
};

export const useExpressionAnalysis = (
  expressions: Ref<ExpressionInput[]>,
  allSections: Ref<CircleLabel[][]>,
) => {
  const definedSets = computed(() => [...new Set(allSections.value.flat())]);

  const hasInputError = (
    value: string,
    parse: ReturnType<typeof setParser>,
    definedSets: string[],
  ) => {
    if (!value.trim()) return false;

    const mathJSON = parseMathJSON(value);
    if (!mathJSON?.isValid) return true;
    if (parse(mathJSON.json) === null) return true;
    if (definedSets.length &&
      extractVariables(mathJSON.json).some(v => !definedSets.includes(v))
    ) return true;

    return false;
  };

  const inputErrors = computed(() => {
    const parse = setParser(allSections.value);
    const sets = definedSets.value;

    return expressions.value.map(({ value }) =>
      hasInputError(value, parse, sets),
    );
  });

  const simplifiedForms = computed(() =>
    expressions.value.map(({ value }) => simplify(value, definedSets.value))
  );

  const disambiguatedForms = computed(() =>
    expressions.value.map(({ value }, index) => {
      if (!value.trim() || inputErrors.value[index] || !isAmbiguous(value)) return null;
      return getDisambiguatedLatex(value);
    })
  );

  const activeSubsets = computed(() => {
    const parse = setParser(allSections.value);
    const sets = definedSets.value;
    const results: HighlightGroup[] = [];

    for (const [index, expression] of expressions.value.entries()) {
      if (expression.hidden) continue;
      if (hasInputError(expression.value, parse, sets)) continue;

      const mathJSON = parseMathJSON(expression.value);
      if (!mathJSON) continue;

      const sections = parse(mathJSON.json);
      if (!sections) continue;

      results.push({
        sections,
        color: COLORS.HIGHLIGHT[index % COLORS.HIGHLIGHT.length],
      });
    }

    return results;
  });

  return { 
    definedSets, 
    inputErrors, 
    simplifiedForms, 
    disambiguatedForms, 
    activeSubsets 
  };
};
