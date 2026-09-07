import { createLabelGenerator } from '@core/utils/label';

import type { Ref } from 'vue';

import { ALPHABET, RESERVED_LABELS } from '../constants.ts';
import type { SetDefinition } from '../types.ts';

export const SET_LABEL_SEQUENCE = ALPHABET.filter(
  (letter) => !(RESERVED_LABELS as readonly string[]).includes(letter),
);

/**
 * hands out the next letter no set has taken yet, skipping reserved labels
 *
 * @example const nextLabel = useLabelGetter(definitions);
 *  console.log(nextLabel()); // 'A'
 *  // add a set labelled "A" to definitions
 *  console.log(nextLabel()); // 'B'
 */
export const useLabelGetter = (definitions: Ref<SetDefinition[]>) =>
  createLabelGenerator({
    getLabels: () => definitions.value.map(({ label }) => label),
    sequence: SET_LABEL_SEQUENCE,
  });
