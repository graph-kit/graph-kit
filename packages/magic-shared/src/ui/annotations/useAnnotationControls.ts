import { nullThrows } from '@core/utils/assert';

import { useProvidedShell } from '../../product/context.ts';

export const useAnnotationControls = () => {
  const shell = useProvidedShell();
  return nullThrows(
    shell.annotations,
    'annotation controls not on shell instance!',
  );
};
