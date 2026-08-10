import { generateId } from '@core/utils/id';

import { type Ref, ref } from 'vue';

import type { HighlightQuery, HighlightQueryId } from './types.ts';

// the rendered mathfield owns its caret and its displayed value, so it takes the commands
export type QueryEditor = {
  insert: (latexString: HighlightQuery) => void;
  replace: (latexString: HighlightQuery) => void;
};

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
  registerQueryEditor: (
    queryId: HighlightQueryId,
    editor: QueryEditor,
  ) => () => void;
  insertIntoQuery: (
    queryId: HighlightQueryId,
    latexString: HighlightQuery,
  ) => void;
  // rewrites the whole query, unlike setLatexQueryString it also updates what the editor shows
  replaceQuery: (
    queryId: HighlightQueryId,
    latexString: HighlightQuery,
  ) => void;
};

export const createHighlightQueries = (): HighlightQueries => {
  const queryIds = ref<HighlightQueryId[]>([generateId()]);

  // kept beside the ids rather than in them so a query is nothing but its latex string
  const latexQueryStrings = ref<Record<HighlightQueryId, HighlightQuery>>({});
  const hiddenQueryIds = ref(new Set<HighlightQueryId>());

  // a plain map because editors are imperative, not something a render depends on
  const queryEditors = new Map<HighlightQueryId, QueryEditor>();

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

    registerQueryEditor: (queryId, editor) => {
      queryEditors.set(queryId, editor);
      return () => queryEditors.delete(queryId);
    },

    insertIntoQuery: (queryId, latexString) => {
      queryEditors.get(queryId)?.insert(latexString);
    },

    replaceQuery: (queryId, latexString) => {
      latexQueryStrings.value[queryId] = latexString;
      queryEditors.get(queryId)?.replace(latexString);
    },
  };
};
