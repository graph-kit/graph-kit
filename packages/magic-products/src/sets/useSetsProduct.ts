import { useCanvas } from '@canvas/surface/index';
import { nullThrows } from '@core/utils/assert';
import {
  Magic,
  MagicProductHost,
  useMagicProduct,
} from '@magic/shared/product';

import { ComputedRef, inject, provide } from 'vue';

import { type Queries, createQueries } from './queries.ts';
import { type QueryAnalysis, useQueryAnalysis } from './queryAnalysis.ts';
import { type SetDefinitions, createSetDefinitions } from './setDefinitions.ts';
import QueryPanel from './sets/components/QueryPanel.vue';
import { useSections } from './sets/composables/useSections.ts';
import { Section } from './types.ts';
import { useCanvasTheme } from './useCanvasTheme.ts';
import { SetsTheme, useSetsTheme } from './useSetsTheme.ts';

export type SetsProductState = {
  queries: Queries;
  sets: SetDefinitions;
  // everything the queries resolve to once read against the set space
  queryAnalysis: QueryAnalysis;
  theme: ComputedRef<SetsTheme>;
  sections: ComputedRef<Section[]>;
};

const useSetsProductState = (magic: Magic): SetsProductState => {
  const queries = createQueries();
  const sets = createSetDefinitions();
  const theme = useSetsTheme(magic);
  const sections = useSections(sets.definitions);

  return {
    queries,
    sets,
    queryAnalysis: useQueryAnalysis(queries, sets, sections),
    theme,
    sections,
  };
};

const SETS_PROVIDE_KEY = 'sets-product';

const provideSetsProductState = (state: SetsProductState) => {
  provide(SETS_PROVIDE_KEY, state);
};

export const useProvidedSetsProductState = () => {
  return nullThrows(
    inject<SetsProductState>(SETS_PROVIDE_KEY),
    'sets product state not provided!',
  );
};

export const useSetsProduct = () => {
  const surface = useCanvas();

  const host: MagicProductHost = {
    surface,
    onAppearanceChanged: () => {},
    transit: {
      encode: () => {},
      decode: () => {},
    },
    // sets has no serializable state yet, so nothing of its own can arrive and there
    // is nothing to adopt. it is not flagged multiplayer, and giving it real transit
    // is what would unblock both.
    multiplayer: {
      validate: (state): state is never => false,
      applyOps: () => {},
      onForceResync: () => {},
    },
  };

  const magic = useMagicProduct(host, {
    productId: 'sets',
    ui: { linkSharing: false },
  });

  const setsProductState = useSetsProductState(magic);
  useCanvasTheme(magic, setsProductState);

  provideSetsProductState(setsProductState);

  magic.componentSlots.add({
    id: 'sets/query-panel',
    component: QueryPanel,
    position: 'bottom-middle',
  });

  return { magic, setsProductState };
};
