import { generateId } from '@core/utils/id';

import { type Ref, ref } from 'vue';

import type { HighlightQuery, HighlightQueryId } from './types.ts';

export type HighlightQueries = {
  // the highlights in render order, each resolved to its data through getQuery
  queryIds: Ref<HighlightQueryId[]>;
  getQuery: (queryId: HighlightQueryId) => {
    latexQueryString: HighlightQuery;
    isHidden: boolean;
  };
  addQuery: () => HighlightQueryId;
  setLatexQueryString: (
    queryId: HighlightQueryId,
    latexQueryString: HighlightQuery,
  ) => void;
  setHidden: (queryId: HighlightQueryId, isHidden: boolean) => void;
};

export const createHighlightQueries = (): HighlightQueries => {
  const queryIds = ref<HighlightQueryId[]>([generateId()]);

  // kept beside the ids rather than in them so a query is nothing but its latex string
  const latexQueryStrings = ref<Record<HighlightQueryId, HighlightQuery>>({});
  const hiddenQueryIds = ref(new Set<HighlightQueryId>());

  return {
    queryIds,

    getQuery: (queryId) => ({
      latexQueryString: latexQueryStrings.value[queryId] ?? '',
      isHidden: hiddenQueryIds.value.has(queryId),
    }),

    addQuery: () => {
      const queryId = generateId();
      queryIds.value.push(queryId);
      return queryId;
    },

    setLatexQueryString: (queryId, latexQueryString) => {
      latexQueryStrings.value[queryId] = latexQueryString;
    },

    setHidden: (queryId, isHidden) => {
      if (isHidden) hiddenQueryIds.value.add(queryId);
      else hiddenQueryIds.value.delete(queryId);
    },
  };
};
