import { nullThrows } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';

import { type Ref, ref } from 'vue';

import { HIGHLIGHT_COLORS } from './sets/other/constants.ts';
import type { HighlightQuery, HighlightQueryId } from './types.ts';

// the rendered mathfield owns its caret and its displayed value, so it takes the commands
type QueryEditor = {
  insert: (latexString: HighlightQuery) => void;
  replace: (latexString: HighlightQuery) => void;
};

export type Query = {
  id: string;
  latexQueryString: HighlightQuery;
  isHidden: boolean;
  color: Color;
};

export type HighlightQueries = {
  // the highlights in render order, each resolved to its data through getQuery
  queryIds: Ref<HighlightQueryId[]>;
  getQuery: (queryId: HighlightQueryId) => Query;
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

// assigns by creation order, cycling the palette once every query gets one
const nextColor = (queryCountBeforeThisOne: number): Color =>
  HIGHLIGHT_COLORS[queryCountBeforeThisOne % HIGHLIGHT_COLORS.length];

export const createHighlightQueries = (): HighlightQueries => {
  const initialQueryId = generateId();
  const queryIds = ref<HighlightQueryId[]>([initialQueryId]);

  // kept beside the ids rather than in them so a query is nothing but its latex string
  const latexQueryStrings = ref<Record<HighlightQueryId, HighlightQuery>>({});
  const hiddenQueryIds = ref(new Set<HighlightQueryId>());
  // assigned once at creation and never reassigned, so a query's color is stable
  const colorsByQueryId = ref<Record<HighlightQueryId, Color>>({
    [initialQueryId]: nextColor(0),
  });

  // a plain map because editors are imperative, not something a render depends on
  const queryEditors = new Map<HighlightQueryId, QueryEditor>();

  return {
    queryIds,

    getQuery: (queryId) => ({
      id: queryId,
      latexQueryString: latexQueryStrings.value[queryId] ?? '',
      isHidden: hiddenQueryIds.value.has(queryId),
      color: nullThrows(
        colorsByQueryId.value[queryId],
        `no color assigned to query ${queryId}`,
      ),
    }),

    addQuery: () => {
      const queryId = generateId();
      colorsByQueryId.value[queryId] = nextColor(queryIds.value.length);
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
