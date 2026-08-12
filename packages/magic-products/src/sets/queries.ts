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

// the live object rather than a snapshot, so every edit to a query is an assignment onto it
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
};

// assigns by creation order, cycling the palette once every query gets one
const nextColor = (queryCountBeforeThisOne: number): Color =>
  QUERY_COLORS[queryCountBeforeThisOne % QUERY_COLORS.length];

// stands in until the query's mathfield mounts, so the commands never need a null check
export const NO_EDITOR: QueryEditor = {
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

  return {
    // a computed because the list only changes through addQuery, while a query itself is edited in place
    queries: computed(() => queries.value),

    getQuery: (queryId) =>
      nullThrows(
        queries.value.find(({ id }) => id === queryId),
        `no query with id ${queryId}`,
      ),

    addQuery: () => {
      const query = createQuery(queries.value.length);
      queries.value.push(query);
      return query.id;
    },
  };
};
