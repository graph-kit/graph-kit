import { useCanvas } from '@canvas/surface/index';
import { nullThrows } from '@core/utils/assert';
import { MagicProductHost, useMagicProduct } from '@magic/shared/product';

import { Ref, inject, provide, ref } from 'vue';

import {
  type HighlightQueries,
  createHighlightQueries,
} from './highlightQueries.ts';
import HighlightPanel from './sets/components/HighlightPanel.vue';
import { CircleLabel, HighlightGroup } from './types.ts';

export type SetsProductState = {
  allSections: Ref<CircleLabel[][]>;
  activeSubsets: Ref<HighlightGroup[]>;
  highlights: HighlightQueries;
};

const useSetsProductState = (): SetsProductState => ({
  allSections: ref([]),
  activeSubsets: ref([]),
  highlights: createHighlightQueries(),
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
    setAppearance: () => {},
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
