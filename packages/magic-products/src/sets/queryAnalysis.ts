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

/** `C`, `C or D`, `C, D or E` */
const labelList = (labels: SetLabel[]) =>
  labels.length < 3
    ? labels.join(' or ')
    : `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}`;

/**
 * why a query does not resolve, in the words the panel puts on it.
 *
 * one per way {@link analyzeQuery} can turn a query down, so a reason cannot be
 * written without a branch that reaches it
 */
export const QUERY_ERRORS = {
  /** the compute engine could not read it as an expression at all */
  unreadable: 'Expression unfinished',
  /** it reads as maths, but not as maths over sets: `A + B`, `2`, `\sin A` */
  notSetNotation: 'Expression can only hold sets and set operators',
  undefinedSets: (labels: SetLabel[]) =>
    labels.length === 1
      ? `No set named ${labels[0]} is on the canvas.`
      : `No sets named ${labelList(labels)} are on the canvas.`,
} as const;

/**
 * one query read against the current set space. `isValid` gates `sections`, so
 * checking it hands back the resolved sections without a second null check, and
 * gates `error` the same way
 */
type AnalyzedQuery =
  | {
      latexQueryString: LatexQueryString;
      isValid: true;
      sections: Section[];
    }
  | {
      latexQueryString: LatexQueryString;
      isValid: false;
      sections: null;
      /** what to tell the reader, see {@link QUERY_ERRORS} */
      error: string;
    };

const analyzeQuery = (
  latexQueryString: LatexQueryString,
  parse: ParseSetExpression,
  definedLabels: SetLabel[],
): AnalyzedQuery => {
  const invalid = (error: string): AnalyzedQuery => ({
    latexQueryString,
    isValid: false,
    sections: null,
    error,
  });

  // an empty query is not an error, it just selects nothing
  if (!latexQueryString.trim()) {
    return { latexQueryString, isValid: true, sections: [] };
  }

  const mathJSON = parseMathJSON(latexQueryString);
  if (!mathJSON.isValid) return invalid(QUERY_ERRORS.unreadable);

  const sections = parse(mathJSON.json);
  if (sections === null) return invalid(QUERY_ERRORS.notSetNotation);

  // with nothing drawn yet every label is unknown, so naming one is not yet a mistake
  const undefinedSets =
    definedLabels.length === 0
      ? []
      : extractVariables(mathJSON.json).filter(
          (variable) => !definedLabels.includes(variable),
        );
  if (undefinedSets.length > 0) {
    return invalid(QUERY_ERRORS.undefinedSets(undefinedSets));
  }

  return { latexQueryString, isValid: true, sections };
};

export type QueryAnalysis = {
  /** why each query does not resolve, undefined for one that reads fine */
  queryErrors: ComputedRef<Record<QueryId, string | undefined>>;
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
    const errors: Record<QueryId, string | undefined> = {};

    for (const [queryId, analysis] of queryIdToAnalysis.value) {
      errors[queryId] = analysis.isValid ? undefined : analysis.error;
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
