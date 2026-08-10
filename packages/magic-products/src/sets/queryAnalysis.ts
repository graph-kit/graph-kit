import { type ComputedRef, computed } from 'vue';

import type { HighlightQueries } from './highlightQueries.ts';
import type { SetDefinitions } from './setDefinitions.ts';
import {
  type ParseSetExpression,
  createSetExpressionParser,
} from './sets/other/createSetExpressionParser.ts';
import {
  getDisambiguatedLatex,
  isAmbiguous,
} from './sets/other/disambiguate.ts';
import { parseMathJSON } from './sets/other/parseMathJSON.ts';
import { simplify } from './sets/other/simplifier/index.ts';
import { extractVariables } from './sets/other/simplifier/truthTable.ts';
import type {
  HighlightGroup,
  HighlightQuery,
  HighlightQueryId,
  SetLabel,
} from './types.ts';
import { SetsProductState } from './useSetsProduct.ts';

export type QueryAnalysis = {
  queryErrors: ComputedRef<Record<HighlightQueryId, boolean>>;
  simplifiedQueries: ComputedRef<Record<HighlightQueryId, string | null>>;
  disambiguatedQueries: ComputedRef<Record<HighlightQueryId, string | null>>;
  // the sections each query resolves to paired with its color, skipping hidden and erroring queries
  activeHighlights: ComputedRef<HighlightGroup[]>;
};

export const useQueryAnalysis = (
  highlights: HighlightQueries,
  sets: SetDefinitions,
  theme: SetsProductState['theme'],
): QueryAnalysis => {
  const definedSetLabels = computed(() =>
    sets.definitions.value.map(({ label }) => label),
  );

  const parseAgainstSetSpace = () =>
    createSetExpressionParser(
      sets.allSections.value,
      (label) => sets.idByLabel.value[label],
    );

  const hasQueryError = (
    latexQueryString: HighlightQuery,
    parse: ParseSetExpression,
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
      queries[queryId] = queryErrors.value[queryId]
        ? null
        : simplify(latexQueryString, sets.idByLabel.value);
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

  const activeHighlights = computed(() => {
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

      const colors = theme.value.set.highlighted;

      results.push({
        sections,
        color: colors[index % colors.length],
      });
    }

    return results;
  });

  return {
    queryErrors,
    simplifiedQueries,
    disambiguatedQueries,
    activeHighlights,
  };
};
