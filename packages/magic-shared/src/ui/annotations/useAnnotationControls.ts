import { nullThrows } from '@core/utils/assert';

import { useProvidedMagic } from '../../product/context.ts';

export const useAnnotationControls = () => {
  const magic = useProvidedMagic();
  return nullThrows(
    magic.annotations,
    'annotation controls not on magic instance!',
  );
};
