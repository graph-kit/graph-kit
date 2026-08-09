import { useCanvas } from '@canvas/surface/index';
import { nullThrows } from '@core/utils/assert';
import { MagicProductHost, useMagicProduct } from '@magic/shared/product';

import { Ref, inject, provide, ref } from 'vue';

import {
  type HighlightQueries,
  createHighlightQueries,
} from './highlightQueries.ts';
import { type SetDefinitions, createSetDefinitions } from './setDefinitions.ts';
import HighlightPanel from './sets/components/HighlightPanel.vue';
import { HighlightGroup } from './types.ts';

export type SetsProductState = {
  activeSubsets: Ref<HighlightGroup[]>;
  highlights: HighlightQueries;
  sets: SetDefinitions;
};

const useSetsProductState = (): SetsProductState => ({
  activeSubsets: ref([]),
  highlights: createHighlightQueries(),
  sets: createSetDefinitions(),
});

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
