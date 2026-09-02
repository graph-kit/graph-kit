import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { Lens } from '../../lens/types.ts';

/** the split form renders as `headline: stat`, with the stat replaced by `N/A` while the chip is disabled */
export type LensChipName =
  | MaybeGetter<string>
  | {
      headline: MaybeGetter<string>;
      stat: MaybeGetter<string | number>;
    };

export type LensChipDefinition = {
  name: LensChipName;
  lens: Lens;
  tooltipLabel?: MaybeGetter<string>;
  /** a string disables the chip and is shown as the reason in place of the tooltip label */
  disabled?: MaybeGetter<string | false | undefined>;
};

export const disabledReason = (chip: LensChipDefinition) =>
  getValue(chip.disabled) || undefined;

export const chipName = (chip: LensChipDefinition) => {
  const { name } = chip;
  if (typeof name !== 'object') return getValue(name);
  const stat = disabledReason(chip) ? 'N/A' : getValue(name.stat);
  return `${getValue(name.headline)}: ${stat}`;
};
