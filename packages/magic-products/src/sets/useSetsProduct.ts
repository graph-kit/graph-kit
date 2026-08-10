import { useCanvas } from '@canvas/surface/index';
import { nullThrows } from '@core/utils/assert';
import { MagicProductHost, useMagicProduct } from '@magic/shared/product';

import { inject, provide } from 'vue';

import {
  type HighlightQueries,
  createHighlightQueries,
} from './highlightQueries.ts';
import { type QueryAnalysis, createQueryAnalysis } from './queryAnalysis.ts';
import { type SetDefinitions, createSetDefinitions } from './setDefinitions.ts';
import HighlightPanel from './sets/components/HighlightPanel.vue';

export type SetsProductState = {
  highlights: HighlightQueries;
  sets: SetDefinitions;
  // everything the queries resolve to once read against the set space
  queryAnalysis: QueryAnalysis;
};

const useSetsProductState = (): SetsProductState => {
  const highlights = createHighlightQueries();
  const sets = createSetDefinitions();

  return {
    highlights,
    sets,
    queryAnalysis: createQueryAnalysis(highlights, sets),
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
  };

  const magic = useMagicProduct(host, {
    productId: 'sets',
    ui: { linkSharing: false },
  });

  const setsProductState = useSetsProductState();
  provideSetsProductState(setsProductState);

  magic.componentSlots.add({
    id: 'sets/highlight-panel',
    component: HighlightPanel,
    position: 'bottom-middle',
  });

  return { magic, setsProductState };
};
