import { computed } from 'vue';

import type { HighlightQueries } from '../../highlightQueries.ts';
import type {
  HighlightGroup,
  HighlightQuery,
  HighlightQueryId,
} from '../../types.ts';
import { SetsProductState } from '../../useSetsProduct.ts';
import { COLORS } from '../other/constants.ts';
import { getDisambiguatedLatex, isAmbiguous } from '../other/disambiguate.ts';
import { setParser } from '../other/expressionParser.ts';
import { parseMathJSON } from '../other/parseMathJSON.ts';
import { simplify } from '../other/simplifier/index.ts';
import { extractVariables } from '../other/simplifier/truthTable.ts';

export const useExpressionAnalysis = (
  highlights: HighlightQueries,
  allSections: SetsProductState['allSections'],
) => {
  const definedSets = computed(() => [...new Set(allSections.value.flat())]);

  const hasInputError = (
    latexQueryString: HighlightQuery,
    parse: ReturnType<typeof setParser>,
    definedSets: string[],
  ) => {
    if (!latexQueryString.trim()) return false;

    const mathJSON = parseMathJSON(latexQueryString);
    if (!mathJSON?.isValid) return true;
    if (parse(mathJSON.json) === null) return true;
    if (
      definedSets.length &&
      extractVariables(mathJSON.json).some((v) => !definedSets.includes(v))
    )
      return true;

    return false;
  };

  const inputErrors = computed(() => {
    const parse = setParser(allSections.value);
    const sets = definedSets.value;
    const errors: Record<HighlightQueryId, boolean> = {};

    for (const queryId of highlights.queryIds.value) {
      const { latexQueryString } = highlights.getQuery(queryId);
      errors[queryId] = hasInputError(latexQueryString, parse, sets);
    }

    return errors;
  });

  const simplifiedForms = computed(() => {
    const forms: Record<HighlightQueryId, string | null> = {};

    for (const queryId of highlights.queryIds.value) {
      const { latexQueryString } = highlights.getQuery(queryId);
      forms[queryId] = simplify(latexQueryString, definedSets.value);
    }

    return forms;
  });

  const disambiguatedForms = computed(() => {
    const forms: Record<HighlightQueryId, string | null> = {};

    for (const queryId of highlights.queryIds.value) {
      const { latexQueryString } = highlights.getQuery(queryId);

      forms[queryId] = null;
      if (!latexQueryString.trim()) continue;
      if (inputErrors.value[queryId]) continue;
      if (!isAmbiguous(latexQueryString)) continue;

      forms[queryId] = getDisambiguatedLatex(latexQueryString);
    }

    return forms;
  });

  const activeSubsets = computed(() => {
    const parse = setParser(allSections.value);
    const sets = definedSets.value;
    const results: HighlightGroup[] = [];

    for (const [index, queryId] of highlights.queryIds.value.entries()) {
      const { latexQueryString, isHidden } = highlights.getQuery(queryId);

      if (isHidden) continue;
      if (hasInputError(latexQueryString, parse, sets)) continue;

      const mathJSON = parseMathJSON(latexQueryString);
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
    activeSubsets,
  };
};
