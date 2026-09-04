import type { Coordinate } from '@core/utils/canvas/index';
import { generateId } from '@core/utils/id';

import { type ComputedRef, type Ref, computed, ref } from 'vue';

import { getSetDefinition } from './circleUtils.ts';
import { useLabelGetter } from './composables/useLabel.ts';
import {
  DEFAULT_CIRCLE_RADIUS,
  MAX_SETS,
  OUTSIDE_ALL_SETS,
} from './constants.ts';
import type { SetDefinition, SetDefinitionId, SetLabel } from './types.ts';

export type SetDefinitions = {
  definitions: Ref<SetDefinition[]>;
  // the only authority on what a label typed into a query means, reserved labels included
  idByLabel: ComputedRef<Record<SetLabel, SetDefinitionId>>;
  getDefinition: (id: SetDefinitionId) => SetDefinition;
  /** undefined when the canvas already holds {@link MAX_SETS} */
  addDefinition: (at: Coordinate) => SetDefinition | undefined;
  removeDefinition: (id: SetDefinitionId) => void;
};

export const createSetDefinitions = (): SetDefinitions => {
  const definitions = ref<SetDefinition[]>([]);

  const nextLabel = useLabelGetter(definitions);

  const idByLabel = computed(() => {
    const ids: Record<SetLabel, SetDefinitionId> = {};

    for (const { label, id } of definitions.value) ids[label] = id;
    ids[OUTSIDE_ALL_SETS.label] = OUTSIDE_ALL_SETS.identity;

    return ids;
  });

  const atCapacity = computed(() => definitions.value.length >= MAX_SETS);

  return {
    definitions,
    idByLabel,

    getDefinition: (id) => getSetDefinition(definitions.value, id),

    addDefinition: (at) => {
      if (atCapacity.value) return;

      const definition: SetDefinition = {
        id: generateId(),
        label: nextLabel(),
        // copied so the definition does not alias the live cursor coordinate
        display: { at: { ...at }, radius: DEFAULT_CIRCLE_RADIUS },
      };

      definitions.value.push(definition);
      return definition;
    },

    removeDefinition: (id) => {
      definitions.value = definitions.value.filter(
        (definition) => definition.id !== id,
      );
    },
  };
};
