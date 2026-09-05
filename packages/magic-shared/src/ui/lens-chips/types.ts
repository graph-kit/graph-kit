import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { DisabledLens, Lens } from '../../lens/types.ts';

/** the split form renders as `term: value`, with the value replaced by `N/A` while the chip is disabled */
export type LensChipLabel =
  | MaybeGetter<string>
  | {
      /** what the chip measures, such as `Total Cost` */
      term: MaybeGetter<string>;
      /** the current reading of the term, such as `42` */
      value: MaybeGetter<string | number>;
    };

export type LensChipDefinition = {
  /** the text the chip displays */
  label: LensChipLabel;
  lens: Lens;
  tooltipLabel?: MaybeGetter<string>;
  /** present disables the chip, both fields included, so `{}` disables with no explanation */
  disabled?: MaybeGetter<DisabledLens | false | undefined>;
};

export const disabledState = (chip: LensChipDefinition) =>
  getValue(chip.disabled) || undefined;

/** the lens a chip puts on the canvas, which for a disabled one explains rather than answers */
export const lensFor = (chip: LensChipDefinition) => {
  const disabled = disabledState(chip);
  return disabled ? disabled.lens : chip.lens;
};

export const chipLabel = (chip: LensChipDefinition) => {
  const { label } = chip;
  if (typeof label !== 'object') return getValue(label);
  const value = disabledState(chip) ? 'N/A' : getValue(label.value);
  return `${getValue(label.term)}: ${value}`;
};
