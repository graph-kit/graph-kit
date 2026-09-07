import { createEventHub } from '@core/events/createEventHub';
import type { ReadonlyEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import type { MathfieldElement } from '@magic/shared/latex';

import { type ComputedRef, computed, ref } from 'vue';

import { QUERY_COLORS } from './constants.ts';
import { type QueriesEventMap, createQueriesEventRegistry } from './events.ts';
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

/** A query stripped to what survives a reload: no id, no editor, no mathfield. */
export type EncodedQuery = {
  latexQueryString: LatexQueryString;
  hidden: boolean;
  color: Color;
};

export type Queries = {
  /** Every query in render order. */
  queries: ComputedRef<Query[]>;
  events: ReadonlyEventHub<QueriesEventMap>;
  /** Throws when no query carries the id. */
  getQuery: (queryId: QueryId) => Query;
  addQuery: () => Query;
  /** Does nothing when no query carries the id. */
  removeQuery: (queryId: QueryId) => void;
  /** Makes queries exactly these, in order. */
  setAll: (queries: EncodedQuery[]) => void;
};

/*
  the first color none of the given queries hold, so removing one puts its color back in
  play. the palette outnumbers the queries a panel allows, making the fallback unreachable
*/
const nextColor = (queries: Query[]): Color =>
  QUERY_COLORS.find(
    (color) => !queries.some((query) => query.color === color),
  ) ?? QUERY_COLORS[0];

// takes its state rather than defaulting it, since a decode arrives holding all of it
const createQuery = (
  { latexQueryString, hidden, color }: EncodedQuery,
  onChanged: () => void,
): Query => {
  const latex = ref<LatexQueryString>(latexQueryString);
  const isHidden = ref(hidden);

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
      if (latex.value === latexString) return;
      latex.value = latexString;
      onChanged();
    },
  };

  return {
    id: generateId(),
    color,
    editor,

    get latexQueryString() {
      return latex.value;
    },

    // an accessor rather than a field, so hiding a query reaches whatever persists it
    get hidden() {
      return isHidden.value;
    },
    set hidden(value: boolean) {
      if (isHidden.value === value) return;
      isHidden.value = value;
      onChanged();
    },
  };
};

const BLANK: EncodedQuery = {
  latexQueryString: '',
  hidden: false,
  color: QUERY_COLORS[0],
};

export const createQueries = (): Queries => {
  const events = createEventHub(createQueriesEventRegistry());
  const changed = () => events.emit('onQueriesChanged');

  const queries = ref<Query[]>([createQuery(BLANK, changed)]);

  return {
    queries: computed(() => queries.value),
    events,

    getQuery: (queryId) =>
      nullThrows(
        queries.value.find(({ id }) => id === queryId),
        `no query with id ${queryId}`,
      ),

    addQuery: () => {
      const query = createQuery(
        { ...BLANK, color: nextColor(queries.value) },
        changed,
      );
      queries.value.push(query);
      changed();
      return query;
    },

    removeQuery: (queryId) => {
      const remaining = queries.value.filter(({ id }) => id !== queryId);
      if (remaining.length === queries.value.length) return;
      queries.value = remaining;
      changed();
    },

    setAll: (incoming) => {
      const restored: Query[] = [];

      for (const query of incoming) {
        // a color off the palette would reach the fill straight from a link
        const color = QUERY_COLORS.includes(query.color)
          ? query.color
          : nextColor(restored);
        restored.push(createQuery({ ...query, color }, changed));
      }

      if (restored.length === 0) restored.push(createQuery(BLANK, changed));

      queries.value = restored;
      changed();
    },
  };
};
