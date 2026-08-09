import { useCanvas } from '@canvas/surface/index';
import { MagicProductHost, useMagicProduct } from '@magic/shared/product';

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

  return magic;
};
