import { nullThrows } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import type { MathfieldElement } from '@magic/shared/latex';

import { type ComputedRef, computed, ref } from 'vue';

import { QUERY_COLORS } from './sets/other/constants.ts';
import type { LatexQueryString, QueryId } from './types.ts';

/** Every way a query's latex can be written, since it cannot be assigned directly. */
type QueryEditor = {
  /** The rendered mathfield, or null while the query has none mounted. */
  element: MathfieldElement | null;
  /** Inserts at the caret, which only exists while the query's mathfield is mounted. */
  insert: (latexString: LatexQueryString) => void;
  /** Rewrites the query in full, leaving the mathfield to reconcile against it. */
  replace: (latexString: LatexQueryString) => void;
};

/** What a mounted mathfield contributes, the rest of the editor being the query's own. */
type QueryEditorCommands = Pick<QueryEditor, 'element' | 'insert'>;

/** A live query rather than a snapshot, so what is read through it is never stale. */
export type Query = {
  id: string;
  /** The query's current latex. Read only, so edit it through {@link Query.editor}. */
  readonly latexQueryString: LatexQueryString;
  hidden: boolean;
  color: Color;
  get editor(): QueryEditor;
  set editor(commands: QueryEditorCommands);
};

export type Queries = {
  /** Every query in render order. */
  queries: ComputedRef<Query[]>;
  /** Throws when no query carries the id. */
  getQuery: (queryId: QueryId) => Query;
  addQuery: () => QueryId;
  /** Does nothing when no query carries the id. */
  removeQuery: (queryId: QueryId) => void;
};

/*
  the first color none of the given queries hold, so removing one puts its color back in
  play. the palette outnumbers the queries a panel allows, making the fallback unreachable
*/
const nextColor = (queries: Query[]): Color =>
  QUERY_COLORS.find(
    (color) => !queries.some((query) => query.color === color),
  ) ?? QUERY_COLORS[0];

/** Stands in until a query's mathfield mounts, so a command never needs a null check. */
export const NO_EDITOR: QueryEditorCommands = {
  element: null,
  insert: () => {},
};

// takes its color rather than picking one, since only the caller knows the queries already out
const createQuery = (color: Color): Query => {
  const latexQueryString = ref<LatexQueryString>('');

  let commands: QueryEditorCommands = NO_EDITOR;

  /*
    one object reading through to whatever commands are current, rather than one built per
    assignment. a copy would freeze element to the null it holds before the field mounts
  */
  const editor: QueryEditor = {
    get element() {
      return commands.element;
    },

    insert: (latexString) => commands.insert(latexString),

    replace: (latexString) => {
      latexQueryString.value = latexString;
    },
  };

  return {
    id: generateId(),
    hidden: false,
    color,

    get latexQueryString() {
      return latexQueryString.value;
    },

    get editor() {
      return editor;
    },

    set editor(replacement) {
      commands = replacement;
    },
  };
};

export const createQueries = (): Queries => {
  const queries = ref<Query[]>([createQuery(nextColor([]))]);

  return {
    queries: computed(() => queries.value),

    getQuery: (queryId) =>
      nullThrows(
        queries.value.find(({ id }) => id === queryId),
        `no query with id ${queryId}`,
      ),

    addQuery: () => {
      const query = createQuery(nextColor(queries.value));
      queries.value.push(query);
      return query.id;
    },

    removeQuery: (queryId) => {
      queries.value = queries.value.filter(({ id }) => id !== queryId);
    },
  };
};
