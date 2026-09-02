import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { Lens } from '../../lens/types.ts';

/** the split form renders as `headline: stat`, with the stat replaced by `N/A` while the chip is disabled */
export type LensChipName =
  | MaybeGetter<string>
  | {
      headline: MaybeGetter<string>;
      stat: MaybeGetter<string | number>;
    };

export type LensChipDisabled = {
  /** shown in place of the tooltip label */
  reason?: string;
  /** previewed on hover in place of the chip's own lens, to show on the canvas what the reason describes */
  lens?: Lens;
};

export type LensChipDefinition = {
  name: LensChipName;
  lens: Lens;
  tooltipLabel?: MaybeGetter<string>;
  /** present disables the chip, both fields included, so `{}` disables with no explanation */
  disabled?: MaybeGetter<LensChipDisabled | false | undefined>;
};

export const disabledState = (chip: LensChipDefinition) =>
  getValue(chip.disabled) || undefined;

/** the lens a chip puts on the canvas, which for a disabled one explains rather than answers */
export const lensFor = (chip: LensChipDefinition) => {
  const disabled = disabledState(chip);
  return disabled ? disabled.lens : chip.lens;
};

export const chipName = (chip: LensChipDefinition) => {
  const { name } = chip;
  if (typeof name !== 'object') return getValue(name);
  const stat = disabledState(chip) ? 'N/A' : getValue(name.stat);
  return `${getValue(name.headline)}: ${stat}`;
};
