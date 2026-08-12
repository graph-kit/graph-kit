import { type ComputedRef, computed } from 'vue';

import type { Queries } from './queries.ts';
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
import type { LatexQueryString, QueryId, Section, SetLabel } from './types.ts';

/**
 * one query read against the current set space. `isValid` gates `sections`, so
 * checking it hands back the resolved sections without a second null check
 */
type AnalyzedQuery =
  | { latexQueryString: LatexQueryString; isValid: true; sections: Section[] }
  | { latexQueryString: LatexQueryString; isValid: false; sections: null };

const analyzeQuery = (
  latexQueryString: LatexQueryString,
  parse: ParseSetExpression,
  definedLabels: SetLabel[],
): AnalyzedQuery => {
  const invalid = {
    latexQueryString,
    isValid: false,
    sections: null,
  } as const;

  // an empty query is not an error, it just selects nothing
  if (!latexQueryString.trim()) {
    return { latexQueryString, isValid: true, sections: [] };
  }

  const mathJSON = parseMathJSON(latexQueryString);
  if (!mathJSON.isValid) return invalid;

  const sections = parse(mathJSON.json);
  if (sections === null) return invalid;

  const namesAnUndefinedSet =
    definedLabels.length > 0 &&
    extractVariables(mathJSON.json).some(
      (variable) => !definedLabels.includes(variable),
    );
  if (namesAnUndefinedSet) return invalid;

  return { latexQueryString, isValid: true, sections };
};

export type QueryAnalysis = {
  queryErrors: ComputedRef<Record<QueryId, boolean>>;
  simplifiedQueries: ComputedRef<Record<QueryId, string | null>>;
  disambiguatedQueries: ComputedRef<Record<QueryId, string | null>>;
  // the sections each query resolves to, keyed by query, skipping erroring queries
  queryIdToSections: ComputedRef<Map<QueryId, Section[]>>;
};

export const useQueryAnalysis = (
  { queries }: Queries,
  sets: SetDefinitions,
  sections: ComputedRef<Section[]>,
): QueryAnalysis => {
  const definedSetLabels = computed(() =>
    sets.definitions.value.map(({ label }) => label),
  );

  /*
    the one place a query gets read against the set space. everything below is a
    view onto this, so a query is never parsed twice and the reads cannot disagree
  */
  const queryIdToAnalysis = computed(() => {
    const parse = createSetExpressionParser(
      sections.value,
      (label) => sets.idByLabel.value[label],
    );
    const labels = definedSetLabels.value;
    const analyses = new Map<QueryId, AnalyzedQuery>();

    for (const { id, latexQueryString } of queries.value) {
      analyses.set(id, analyzeQuery(latexQueryString, parse, labels));
    }

    return analyses;
  });

  const queryErrors = computed(() => {
    const errors: Record<QueryId, boolean> = {};

    for (const [queryId, { isValid }] of queryIdToAnalysis.value) {
      errors[queryId] = !isValid;
    }

    return errors;
  });

  const simplifiedQueries = computed(() => {
    const queries: Record<QueryId, string | null> = {};

    for (const [
      queryId,
      { latexQueryString, isValid },
    ] of queryIdToAnalysis.value) {
      queries[queryId] = isValid
        ? simplify(latexQueryString, sets.idByLabel.value)
        : null;
    }

    return queries;
  });

  const disambiguatedQueries = computed(() => {
    const queries: Record<QueryId, string | null> = {};

    for (const [
      queryId,
      { latexQueryString, isValid },
    ] of queryIdToAnalysis.value) {
      queries[queryId] = null;
      if (!latexQueryString.trim()) continue;
      if (!isValid) continue;
      if (!isAmbiguous(latexQueryString)) continue;

      queries[queryId] = getDisambiguatedLatex(latexQueryString);
    }

    return queries;
  });

  const queryIdToSections = computed(() => {
    const sectionsByQueryId = new Map<QueryId, Section[]>();

    for (const [queryId, analysis] of queryIdToAnalysis.value) {
      if (!analysis.isValid) continue;
      sectionsByQueryId.set(queryId, analysis.sections);
    }

    return sectionsByQueryId;
  });

  return {
    queryErrors,
    simplifiedQueries,
    disambiguatedQueries,
    queryIdToSections,
  };
};
