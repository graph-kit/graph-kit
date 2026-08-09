import { computed } from 'vue';

import type { HighlightQueries } from '../../highlightQueries.ts';
import type { SetDefinitions } from '../../setDefinitions.ts';
import type {
  HighlightGroup,
  HighlightQuery,
  HighlightQueryId,
  SetDefinitionId,
  SetLabel,
} from '../../types.ts';
import { COLORS } from '../other/constants.ts';
import {
  type ParseSetExpression,
  createSetExpressionParser,
} from '../other/createSetExpressionParser.ts';
import { getDisambiguatedLatex, isAmbiguous } from '../other/disambiguate.ts';
import { parseMathJSON } from '../other/parseMathJSON.ts';
import { simplify } from '../other/simplifier/index.ts';
import { extractVariables } from '../other/simplifier/truthTable.ts';

export const useQueryAnalysis = (
  highlights: HighlightQueries,
  sets: SetDefinitions,
) => {
  const definedSetLabels = computed(() =>
    sets.definitions.value.map(({ label }) => label),
  );

  const parseAgainstSetSpace = () =>
    createSetExpressionParser<SetDefinitionId>(
      sets.allSections.value,
      (label) => sets.idByLabel.value[label],
    );

  const hasQueryError = (
    latexQueryString: HighlightQuery,
    parse: ParseSetExpression<SetDefinitionId>,
    definedLabels: SetLabel[],
  ) => {
    if (!latexQueryString.trim()) return false;

    const mathJSON = parseMathJSON(latexQueryString);
    if (!mathJSON?.isValid) return true;
    if (parse(mathJSON.json) === null) return true;
    if (
      definedLabels.length &&
      extractVariables(mathJSON.json).some(
        (variable) => !definedLabels.includes(variable),
      )
    )
      return true;

    return false;
  };

  const queryErrors = computed(() => {
    const parse = parseAgainstSetSpace();
    const labels = definedSetLabels.value;
    const errors: Record<HighlightQueryId, boolean> = {};

    for (const queryId of highlights.queryIds.value) {
      const { latexQueryString } = highlights.getQuery(queryId);
      errors[queryId] = hasQueryError(latexQueryString, parse, labels);
    }

    return errors;
  });

  const simplifiedQueries = computed(() => {
    const queries: Record<HighlightQueryId, string | null> = {};

    for (const queryId of highlights.queryIds.value) {
      const { latexQueryString } = highlights.getQuery(queryId);
      queries[queryId] = simplify(latexQueryString, definedSetLabels.value);
    }

    return queries;
  });

  const disambiguatedQueries = computed(() => {
    const queries: Record<HighlightQueryId, string | null> = {};

    for (const queryId of highlights.queryIds.value) {
      const { latexQueryString } = highlights.getQuery(queryId);

      queries[queryId] = null;
      if (!latexQueryString.trim()) continue;
      if (queryErrors.value[queryId]) continue;
      if (!isAmbiguous(latexQueryString)) continue;

      queries[queryId] = getDisambiguatedLatex(latexQueryString);
    }

    return queries;
  });

  const activeSubsets = computed(() => {
    const parse = parseAgainstSetSpace();
    const labels = definedSetLabels.value;
    const results: HighlightGroup[] = [];

    for (const [index, queryId] of highlights.queryIds.value.entries()) {
      const { latexQueryString, isHidden } = highlights.getQuery(queryId);

      if (isHidden) continue;
      if (hasQueryError(latexQueryString, parse, labels)) continue;

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
    definedSetLabels,
    queryErrors,
    simplifiedQueries,
    disambiguatedQueries,
    activeSubsets,
  };
};
