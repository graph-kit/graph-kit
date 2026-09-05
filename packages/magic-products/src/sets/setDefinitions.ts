import { createEventHub } from '@core/events/createEventHub';
import type { ReadonlyEventHub } from '@core/events/createEventHub';
import type { Coordinate } from '@core/utils/canvas/index';
import { generateId } from '@core/utils/id';

import { type ComputedRef, type Ref, computed, ref } from 'vue';

import { getSetDefinition } from './circleUtils.ts';
import { useLabelGetter } from './composables/useLabel.ts';
import {
  DEFAULT_CIRCLE_RADIUS,
  MAX_CIRCLE_RADIUS,
  MAX_SETS,
  MIN_CIRCLE_RADIUS,
  OUTSIDE_ALL_SETS,
  RESERVED_LABELS,
} from './constants.ts';
import {
  type SetDefinitionsEventMap,
  createSetDefinitionsEventRegistry,
} from './events.ts';
import type { SetDefinition, SetDefinitionId, SetLabel } from './types.ts';

export type SetDefinitions = {
  definitions: Ref<SetDefinition[]>;
  // the only authority on what a label typed into a query means, reserved labels included
  idByLabel: ComputedRef<Record<SetLabel, SetDefinitionId>>;
  events: ReadonlyEventHub<SetDefinitionsEventMap>;

  getDefinition: (id: SetDefinitionId) => SetDefinition;
  /** false for an id no set carries, which is how a gesture survives a peer's removal */
  hasDefinition: (id: SetDefinitionId) => boolean;

  /** the authoring path: takes a point and names the set itself */
  addDefinition: (at: Coordinate) => SetDefinition | undefined;
  /**
   * adds sets already carrying their id and label, which is what a decode, an undo or a
   * room hands over. answers with the ones it admitted, see {@link SetDefinitions.setAll}
   */
  addDefinitions: (definitions: SetDefinition[]) => SetDefinition[];
  removeDefinition: (id: SetDefinitionId) => void;
  remove: (ids: SetDefinitionId[]) => void;
  /** makes definitions exactly these, which is what a decode or a room's copy does */
  setAll: (definitions: SetDefinition[]) => void;

  /** moves by a delta, the shape a drag reports in */
  moveDefinition: (id: SetDefinitionId, by: Coordinate) => void;
  resizeDefinition: (id: SetDefinitionId, radius: number) => void;
  /** puts a set exactly here, which is what a peer's in flight drag does */
  placeDefinition: (id: SetDefinitionId, at: Coordinate) => void;
  /** the gesture settled, see {@link SetDefinitionsEventMap.onDisplayCommitted} */
  commitDisplay: (setIds: SetDefinitionId[]) => void;
};

const RESERVED = new Set<SetLabel>(RESERVED_LABELS);

const clampRadius = (radius: number) =>
  Number.isFinite(radius)
    ? Math.min(Math.max(radius, MIN_CIRCLE_RADIUS), MAX_CIRCLE_RADIUS)
    : DEFAULT_CIRCLE_RADIUS;

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

/**
 * The one gate every bulk path goes through: a link, saved state, an undo and a room all
 * arrive here. No caller wants an over capacity or duplicate labelled canvas, so the
 * checks live with the store that has to hold the result rather than at each doorway.
 */
const admit = (
  candidates: SetDefinition[],
  held: SetDefinition[],
): SetDefinition[] => {
  const ids = new Set(held.map(({ id }) => id));
  const labels = new Set(held.map(({ label }) => label));
  const admitted: SetDefinition[] = [];

  for (const candidate of candidates) {
    if (ids.size >= MAX_SETS) break;
    if (ids.has(candidate.id)) continue;
    if (labels.has(candidate.label) || RESERVED.has(candidate.label)) continue;

    ids.add(candidate.id);
    labels.add(candidate.label);
    admitted.push({
      id: candidate.id,
      label: candidate.label,
      // copied so the store never aliases whatever the caller goes on holding
      display: {
        at: {
          x: finite(candidate.display.at.x),
          y: finite(candidate.display.at.y),
        },
        radius: clampRadius(candidate.display.radius),
      },
    });
  }

  return admitted;
};

export const createSetDefinitions = (): SetDefinitions => {
  const definitions = ref<SetDefinition[]>([]);
  const events = createEventHub(createSetDefinitionsEventRegistry());

  const nextLabel = useLabelGetter(definitions);

  const idByLabel = computed(() => {
    const ids: Record<SetLabel, SetDefinitionId> = {};

    for (const { label, id } of definitions.value) ids[label] = id;
    ids[OUTSIDE_ALL_SETS.label] = OUTSIDE_ALL_SETS.identity;

    return ids;
  });

  const atCapacity = computed(() => definitions.value.length >= MAX_SETS);

  const find = (id: SetDefinitionId) =>
    definitions.value.find((definition) => definition.id === id);

  const addDefinitions: SetDefinitions['addDefinitions'] = (incoming) => {
    const added = admit(incoming, definitions.value);
    if (added.length === 0) return [];

    definitions.value.push(...added);
    events.emit('onDefinitionsChanged', { added, removedIds: [] });
    return added;
  };

  const remove: SetDefinitions['remove'] = (ids) => {
    const removing = new Set(ids.filter((id) => !!find(id)));
    if (removing.size === 0) return;

    definitions.value = definitions.value.filter(
      (definition) => !removing.has(definition.id),
    );
    events.emit('onDefinitionsChanged', {
      added: [],
      removedIds: [...removing],
    });
  };

  return {
    definitions,
    idByLabel,
    events,

    getDefinition: (id) => getSetDefinition(definitions.value, id),
    hasDefinition: (id) => !!find(id),

    addDefinition: (at) => {
      if (atCapacity.value) return;

      const [added] = addDefinitions([
        {
          id: generateId(),
          label: nextLabel(),
          display: { at: { ...at }, radius: DEFAULT_CIRCLE_RADIUS },
        },
      ]);

      return added;
    },

    addDefinitions,
    removeDefinition: (id) => remove([id]),
    remove,

    setAll: (incoming) => {
      const previous = definitions.value;
      const admitted = admit(incoming, []);

      const previousIds = new Set(previous.map(({ id }) => id));
      const admittedIds = new Set(admitted.map(({ id }) => id));

      definitions.value = admitted;

      const added = admitted.filter(({ id }) => !previousIds.has(id));
      const removedIds = [...previousIds].filter((id) => !admittedIds.has(id));

      if (added.length > 0 || removedIds.length > 0) {
        events.emit('onDefinitionsChanged', { added, removedIds });
      }

      // a set that survived the write is very likely somewhere else now, and no other
      // event says so
      const retained = admitted
        .filter(({ id }) => previousIds.has(id))
        .map(({ id }) => id);
      if (retained.length > 0) events.emit('onDisplayCommitted', retained);
    },

    moveDefinition: (id, by) => {
      const { display } = find(id) ?? {};
      if (!display) return;
      display.at.x += by.x;
      display.at.y += by.y;
    },

    resizeDefinition: (id, radius) => {
      const definition = find(id);
      if (!definition) return;
      definition.display.radius = clampRadius(radius);
    },

    placeDefinition: (id, at) => {
      const { display } = find(id) ?? {};
      if (!display) return;
      display.at.x = at.x;
      display.at.y = at.y;
    },

    commitDisplay: (setIds) => {
      const committed = setIds.filter((id) => !!find(id));
      if (committed.length === 0) return;
      events.emit('onDisplayCommitted', committed);
    },
  };
};
