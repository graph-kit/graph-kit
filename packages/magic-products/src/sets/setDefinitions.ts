import type { Coordinate } from '@core/utils/canvas/index';
import { generateId } from '@core/utils/id';

import { type ComputedRef, type Ref, computed, ref } from 'vue';

import { useAllSections } from './sets/composables/useAllSections.ts';
import { useLabelGetter } from './sets/composables/useLabel.ts';
import { useOverlaps } from './sets/composables/useOverlaps.ts';
import { getSetDefinition } from './sets/other/circleUtils.ts';
import {
  DEFAULT_CIRCLE_RADIUS,
  OUTSIDE_ALL_SETS,
} from './sets/other/constants.ts';
import type {
  Overlap,
  Section,
  SetDefinition,
  SetDefinitionId,
  SetLabel,
} from './types.ts';

export type SetDefinitions = {
  definitions: Ref<SetDefinition[]>;
  overlaps: ComputedRef<Overlap[]>;
  allSections: ComputedRef<Section[]>;
  // the only authority on what a label typed into a query means, reserved labels included
  idByLabel: ComputedRef<Record<SetLabel, SetDefinitionId>>;
  getDefinition: (id: SetDefinitionId) => SetDefinition;
  addDefinition: (at: Coordinate) => SetDefinition;
  removeDefinition: (id: SetDefinitionId) => void;
};

export const createSetDefinitions = (): SetDefinitions => {
  const definitions = ref<SetDefinition[]>([]);

  const nextLabel = useLabelGetter(definitions);
  const overlaps = useOverlaps(definitions);
  const allSections = useAllSections(definitions, overlaps);

  const idByLabel = computed(() => {
    const ids: Record<SetLabel, SetDefinitionId> = {};

    for (const { label, id } of definitions.value) ids[label] = id;
    ids[OUTSIDE_ALL_SETS.label] = OUTSIDE_ALL_SETS.identity;

    return ids;
  });

  return {
    definitions,
    overlaps,
    allSections,
    idByLabel,

    getDefinition: (id) => getSetDefinition(definitions.value, id),

    addDefinition: (at) => {
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
