import { nullThrows } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';

import { type ComputedRef, computed, ref } from 'vue';

import { QUERY_COLORS } from './sets/other/constants.ts';
import type { LatexQueryString, QueryId } from './types.ts';

// the rendered mathfield owns its caret and its displayed value, so it takes the commands
type QueryEditor = {
  insert: (latexString: LatexQueryString) => void;
  replace: (latexString: LatexQueryString) => void;
};

export type Query = {
  id: string;
  latexQueryString: LatexQueryString;
  isHidden: boolean;
  color: Color;
  editor: QueryEditor;
};

export type Queries = {
  // every query in render order
  queries: ComputedRef<Query[]>;
  getQuery: (queryId: QueryId) => Query;
  addQuery: () => QueryId;
  setLatexQueryString: (
    queryId: QueryId,
    latexQueryString: LatexQueryString,
  ) => void;
  setHidden: (queryId: QueryId, isHidden: boolean) => void;
  registerQueryEditor: (queryId: QueryId, editor: QueryEditor) => () => void;
  insertIntoQuery: (queryId: QueryId, latexString: LatexQueryString) => void;
  // rewrites the whole query, unlike setLatexQueryString it also updates what the editor shows
  replaceQuery: (queryId: QueryId, latexString: LatexQueryString) => void;
};

// assigns by creation order, cycling the palette once every query gets one
const nextColor = (queryCountBeforeThisOne: number): Color =>
  QUERY_COLORS[queryCountBeforeThisOne % QUERY_COLORS.length];

// stands in until the query's mathfield mounts, so the commands never need a null check
const NO_EDITOR: QueryEditor = {
  insert: () => {},
  replace: () => {},
};

// color comes from the count so it is fixed at creation, keeping a query's color stable
const createQuery = (queryCountBeforeThisOne: number): Query => ({
  id: generateId(),
  latexQueryString: '',
  isHidden: false,
  color: nextColor(queryCountBeforeThisOne),
  editor: NO_EDITOR,
});

export const createQueries = (): Queries => {
  const queries = ref<Query[]>([createQuery(0)]);

  const getQuery = (queryId: QueryId) =>
    nullThrows(
      queries.value.find(({ id }) => id === queryId),
      `no query with id ${queryId}`,
    );

  return {
    // handed out as a computed so the list is read through the actions below
    queries: computed(() => queries.value),

    getQuery,

    addQuery: () => {
      const query = createQuery(queries.value.length);
      queries.value.push(query);
      return query.id;
    },

    setLatexQueryString: (queryId, latexQueryString) => {
      getQuery(queryId).latexQueryString = latexQueryString;
    },

    setHidden: (queryId, isHidden) => {
      getQuery(queryId).isHidden = isHidden;
    },

    registerQueryEditor: (queryId, editor) => {
      // the query is captured so unregistering still works once it has been removed
      const query = getQuery(queryId);
      query.editor = editor;
      return () => {
        query.editor = NO_EDITOR;
      };
    },

    insertIntoQuery: (queryId, latexString) => {
      getQuery(queryId).editor.insert(latexString);
    },

    replaceQuery: (queryId, latexString) => {
      const query = getQuery(queryId);
      query.latexQueryString = latexString;
      query.editor.replace(latexString);
    },
  };
};
