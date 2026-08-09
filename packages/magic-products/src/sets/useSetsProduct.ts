import { useCanvas } from '@canvas/surface/index';
import { nullThrows } from '@core/utils/assert';
import { MagicProductHost, useMagicProduct } from '@magic/shared/product';

import { Ref, inject, provide, ref } from 'vue';

import ExpressionPanel from './sets/components/ExpressionPanel.vue';
import { CircleLabel, HighlightGroup } from './types.ts';

export type SetsProductState = {
  allSections: Ref<CircleLabel[][]>;
  activeSubsets: Ref<HighlightGroup[]>;
};

const useSetsProductState = (): SetsProductState => ({
  allSections: ref([]),
  activeSubsets: ref([]),
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
    id: 'sets/expression-panel',
    component: ExpressionPanel,
    position: 'bottom-middle',
  });

  return { magic, setsProductState };
};
