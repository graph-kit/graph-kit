import { nullThrows } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';

import { type ComputedRef, computed, ref } from 'vue';

import { QUERY_COLORS } from './sets/other/constants.ts';
import type { LatexQueryString, QueryId } from './types.ts';

// inserting at the caret only means something while a mathfield is mounted, so it renders this
type QueryEditorCommands = {
  insert: (latexString: LatexQueryString) => void;
};

// the commands once a query owns them, carrying the only write it allows
type QueryEditor = QueryEditorCommands & {
  // the one way a query's latex moves, so a rewrite always reads as one
  replace: (latexString: LatexQueryString) => void;
};

// the live object rather than a snapshot, so every edit to a query is an assignment onto it
export type Query = {
  id: string;
  // written only through the editor, so a rewrite can never leave the mathfield showing something else
  readonly latexQueryString: LatexQueryString;
  isHidden: boolean;
  color: Color;
  get editor(): QueryEditor;
  set editor(commands: QueryEditorCommands);
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
export const NO_EDITOR: QueryEditorCommands = {
  insert: () => {},
};

// color comes from the count so it is fixed at creation, keeping a query's color stable
const createQuery = (queryCountBeforeThisOne: number): Query => {
  // private, so replace is the only way the string can move
  const latexQueryString = ref<LatexQueryString>('');

  // the mathfield reconciles itself against what it is handed, so this reaches it through the model
  const replace = (latexString: LatexQueryString) => {
    latexQueryString.value = latexString;
  };

  let editor: QueryEditor = { ...NO_EDITOR, replace };

  return {
    id: generateId(),
    isHidden: false,
    color: nextColor(queryCountBeforeThisOne),

    get latexQueryString() {
      return latexQueryString.value;
    },

    get editor() {
      return editor;
    },

    set editor(commands) {
      editor = { ...commands, replace };
    },
  };
};

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
