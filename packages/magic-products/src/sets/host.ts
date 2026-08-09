import { useCanvas } from '@canvas/surface/index';
import { createEventHub } from '@graph/primitives/events/createEventHub';
import { MagicProductHost, useMagicProduct } from '@magic/shared/product';

export const useSetsProduct = () => {
  const surface = useCanvas();

  const host: MagicProductHost = {
    setAppearance: () => {},
    events: createEventHub<{ onStructureChange: () => void }>({
      onStructureChange: new Set(),
    }),
    surface: surface,
    transit: {
      encode: () => {},
      decode: () => {},
    },
  };

  const magic = useMagicProduct(host, {
    productId: 'sets',
    ui: { linkSharing: false },
  });

  return magic;
};
