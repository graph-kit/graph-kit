import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { Lens } from '../../lens/types.ts';

export type LensChipDefinition = {
  name: MaybeGetter<string>;
  lens: Lens;
  tooltipLabel?: MaybeGetter<string>;
  /** a string disables the chip and is shown in place of the tooltip label */
  disabled?: MaybeGetter<string | false | undefined>;
};

export const disabledReason = (chip: LensChipDefinition) =>
  getValue(chip.disabled) || undefined;
