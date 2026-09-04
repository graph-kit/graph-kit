import { nullThrows } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import type { MathfieldElement } from '@magic/shared/latex';

import { type ComputedRef, computed, ref } from 'vue';

import { QUERY_COLORS } from './constants.ts';
import type { LatexQueryString, QueryId } from './types.ts';

/** Handed the mathfield the query mounted, the one place one is guaranteed to exist. */
export type QueryMountedCallback = (element: MathfieldElement) => void;

/** Every way a query's latex can be written, since it cannot be assigned directly. */
type QueryEditor = {
  /**
   * Registers against the query's mathfield mounting and returns the unregister. Runs the
   * callback right away when one is already mounted, so a late caller is not left waiting.
   */
  onMounted: (callback: QueryMountedCallback) => () => void;
  /** Hands the query the mathfield rendering it, returning the handback for unmount. */
  mount: (commands: QueryEditorCommands) => () => void;
  /** Inserts at the caret, which only exists while the query's mathfield is mounted. */
  insert: (latexString: LatexQueryString) => void;
  /** Rewrites the query in full, leaving the mathfield to reconcile against it. */
  replace: (latexString: LatexQueryString) => void;
  /** element ref of mathfield LaTeX editor, null if not mounted. */
  element: MathfieldElement | null;
};

/** What a mounted mathfield contributes, the rest of the editor being the query's own. */
type QueryEditorCommands = Pick<QueryEditor, 'insert'> & {
  /** Never null, since a field only hands its commands over once it has an element. */
  element: MathfieldElement;
};

/** A live query rather than a snapshot, so what is read through it is never stale. */
export type Query = {
  id: string;
  /** The query's current latex. Read only, so edit it through {@link Query['editor']}. */
  readonly latexQueryString: LatexQueryString;
  hidden: boolean;
  color: Color;
  readonly editor: QueryEditor;
};

export type Queries = {
  /** Every query in render order. */
  queries: ComputedRef<Query[]>;
  /** Throws when no query carries the id. */
  getQuery: (queryId: QueryId) => Query;
  addQuery: () => Query;
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

// takes its color rather than picking one, since only the caller knows the queries already out
const createQuery = (color: Color): Query => {
  const latexQueryString = ref<LatexQueryString>('');

  // null until a mathfield renders the query, which is well after the query itself exists
  let commands: QueryEditorCommands | null = null;
  const mountedCallbacks = new Set<QueryMountedCallback>();

  /*
    the query holds the callbacks rather than the mathfield, so subscribing before one is
    rendered still reaches the mount that comes later
  */
  const editor: QueryEditor = {
    element: null,

    onMounted: (callback) => {
      if (commands) callback(commands.element);

      mountedCallbacks.add(callback);
      return () => {
        mountedCallbacks.delete(callback);
      };
    },

    mount: (mounted) => {
      commands = mounted;
      for (const callback of mountedCallbacks) callback(mounted.element);

      // checked by identity, so a stale field's unmount cannot clear the one that replaced it
      return () => {
        if (commands === mounted) commands = null;
      };
    },

    insert: (latexString) => commands?.insert(latexString),

    replace: (latexString) => {
      latexQueryString.value = latexString;
    },
  };

  return {
    id: generateId(),
    hidden: false,
    color,
    editor,

    get latexQueryString() {
      return latexQueryString.value;
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
      return query;
    },

    removeQuery: (queryId) => {
      queries.value = queries.value.filter(({ id }) => id !== queryId);
    },
  };
};
