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
  /** a set moved or resized */
  onDisplayChanged: (setIds: readonly SetDefinitionId[]) => void;
};

export const createSetDefinitionsEventRegistry =
  (): EventMapToEventRegistry<SetDefinitionsEventMap> => ({
    onDefinitionsChanged: new Set(),
    onDisplayChanged: new Set(),
  });

export type QueriesEventMap = {
  /** a query arrived, left, or had its latex or visibility rewritten */
  onQueriesChanged: () => void;
};

export const createQueriesEventRegistry =
  (): EventMapToEventRegistry<QueriesEventMap> => ({
    onQueriesChanged: new Set(),
  });
