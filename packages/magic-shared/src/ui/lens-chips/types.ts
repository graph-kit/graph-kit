import { MaybeGetter } from '@core/utils/maybeGetter/index';

import { Lens } from '../../lens/types.ts';

export type LensChipDefinition = {
  name: MaybeGetter<string>;
  lens: Lens;
  tooltipLabel?: MaybeGetter<string>;
};
