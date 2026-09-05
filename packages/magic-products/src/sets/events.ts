import type { EventMapToEventRegistry } from '@core/events/types';

import type { SetDefinition, SetDefinitionId } from './types.ts';

export type DefinitionsChange = {
  /** definitions added in this change */
  added: SetDefinition[];
  /** definitions removed in this change */
  removedIds: SetDefinitionId[];
};

export type SetDefinitionsEventMap = {
  /** triggered when a set is created or removed */
  onDefinitionsChanged: (change: Readonly<DefinitionsChange>) => void;
  /**
   * a gesture over a circle settled. the boundary history records at and a room writes
   * at, the same one `onNodePositionsCommitted` draws for a graph. moving and resizing
   * both land here, since both are the set's display changing
   */
  onDisplayCommitted: (setIds: readonly SetDefinitionId[]) => void;
};

export const createSetDefinitionsEventRegistry =
  (): EventMapToEventRegistry<SetDefinitionsEventMap> => ({
    onDefinitionsChanged: new Set(),
    onDisplayCommitted: new Set(),
  });

export type QueriesEventMap = {
  /** a query arrived, left, or had its latex or visibility rewritten */
  onQueriesChanged: () => void;
};

export const createQueriesEventRegistry =
  (): EventMapToEventRegistry<QueriesEventMap> => ({
    onQueriesChanged: new Set(),
  });
