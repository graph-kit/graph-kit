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
  // only the rendered mathfield knows where its caret is, so it registers how to insert
  registerInsertHandler: (
    queryId: HighlightQueryId,
    insert: (latexString: HighlightQuery) => void,
  ) => () => void;
  insertIntoQuery: (
    queryId: HighlightQueryId,
    latexString: HighlightQuery,
  ) => void;
};

export const createHighlightQueries = (): HighlightQueries => {
  const queryIds = ref<HighlightQueryId[]>([generateId()]);

  // kept beside the ids rather than in them so a query is nothing but its latex string
  const latexQueryStrings = ref<Record<HighlightQueryId, HighlightQuery>>({});
  const hiddenQueryIds = ref(new Set<HighlightQueryId>());

  // a plain map because handlers are imperative, not something a render depends on
  const insertHandlers = new Map<
    HighlightQueryId,
    (latexString: HighlightQuery) => void
  >();

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

    registerInsertHandler: (queryId, insert) => {
      insertHandlers.set(queryId, insert);
      return () => insertHandlers.delete(queryId);
    },

    insertIntoQuery: (queryId, latexString) => {
      insertHandlers.get(queryId)?.(latexString);
    },
  };
};
