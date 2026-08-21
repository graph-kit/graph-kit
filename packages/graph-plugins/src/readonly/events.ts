import { EventMapToEventRegistry } from '@core/events/types';

export type ReadonlyEventMap = {
  /** readonly was entered or exited */
  onReadonlyChange: (isActive: boolean) => void;
};

export const createReadonlyEventRegistry =
  (): EventMapToEventRegistry<ReadonlyEventMap> => ({
    onReadonlyChange: new Set(),
  });
