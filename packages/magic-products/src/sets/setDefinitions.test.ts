import { nullThrows } from '@core/utils/assert';
import { describe, expect, it, vi } from 'vitest';

import {
  MAX_CIRCLE_RADIUS,
  MAX_SETS,
  MIN_CIRCLE_RADIUS,
  OUTSIDE_ALL_SETS,
} from './constants.ts';
import { type DefinitionsChange } from './events.ts';
import { type SetDefinitions, createSetDefinitions } from './setDefinitions.ts';
import type { SetDefinition } from './types.ts';

const at = { x: 0, y: 0 };

const definitionOf = (
  id: string,
  label: string,
  display: Partial<SetDefinition['display']> = {},
): SetDefinition => ({
  id,
  label,
  display: { at: { ...at }, radius: MIN_CIRCLE_RADIUS, ...display },
});

/** every change the store reported, in order */
const recordChanges = (sets: SetDefinitions) => {
  const changes: DefinitionsChange[] = [];
  sets.events.subscribe('onDefinitionsChanged', (change) =>
    changes.push({
      added: [...change.added],
      removedIds: [...change.removedIds],
    }),
  );
  return changes;
};

/** a canvas with `count` sets already on it */
const filledTo = (count: number) => {
  const sets = createSetDefinitions();
  for (let i = 0; i < count; i++) sets.addDefinition(at);
  return sets;
};

describe(createSetDefinitions, () => {
  it('takes sets up to the cap', () => {
    expect(filledTo(MAX_SETS).definitions.value).toHaveLength(MAX_SETS);
  });

  it('turns down a set past the cap rather than adding an unlabelled one', () => {
    const sets = filledTo(MAX_SETS);

    expect(sets.addDefinition(at)).toBeUndefined();
    expect(sets.definitions.value).toHaveLength(MAX_SETS);
  });

  it('takes another once one is removed', () => {
    const sets = filledTo(MAX_SETS);
    const [first] = sets.definitions.value;

    sets.removeDefinition(first.id);

    // the freed label comes back rather than the sequence running on past it
    expect(sets.addDefinition(at)?.label).toBe(first.label);
    expect(sets.definitions.value).toHaveLength(MAX_SETS);
  });

  it('stays inside the alphabet the simplifier can read', () => {
    const labels = filledTo(MAX_SETS).definitions.value.map(
      ({ label }) => label,
    );

    expect(labels).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  it('reports what one add and one remove did', () => {
    const sets = createSetDefinitions();
    const changes = recordChanges(sets);

    const added = nullThrows(sets.addDefinition(at), 'the canvas was empty');
    sets.removeDefinition(added.id);

    expect(changes).toEqual([
      { added: [added], removedIds: [] },
      { added: [], removedIds: [added.id] },
    ]);
  });

  it('says nothing for a remove of an id no set carries', () => {
    const sets = filledTo(1);
    const changes = recordChanges(sets);

    sets.remove(['not-a-set']);

    expect(changes).toEqual([]);
  });

  describe('the paths a decode, an undo and a room arrive on', () => {
    it('keeps the label it was handed rather than naming the set itself', () => {
      const sets = createSetDefinitions();

      sets.addDefinitions([definitionOf('from-a-peer', 'D')]);

      // a query naming D has to still mean this set once it lands
      expect(sets.idByLabel.value['D']).toBe('from-a-peer');
    });

    it('turns down a duplicate id, a taken label and a reserved one', () => {
      const sets = createSetDefinitions();
      sets.addDefinitions([definitionOf('first', 'A')]);

      const admitted = sets.addDefinitions([
        definitionOf('first', 'B'),
        definitionOf('second', 'A'),
        definitionOf('third', OUTSIDE_ALL_SETS.label),
        definitionOf('fourth', 'B'),
      ]);

      expect(admitted.map(({ id }) => id)).toEqual(['fourth']);
    });

    it('stops at the cap rather than overfilling the canvas', () => {
      const sets = createSetDefinitions();

      sets.setAll(
        Array.from({ length: MAX_SETS + 4 }, (_, index) =>
          definitionOf(`set-${index}`, String(index)),
        ),
      );

      expect(sets.definitions.value).toHaveLength(MAX_SETS);
    });

    it('clamps a radius and drops coordinates that are not numbers', () => {
      const sets = createSetDefinitions();

      sets.setAll([
        definitionOf('tiny', 'A', { radius: 1 }),
        definitionOf('huge', 'B', { radius: MAX_CIRCLE_RADIUS * 10 }),
        definitionOf('nowhere', 'C', { at: { x: NaN, y: Infinity } }),
      ]);

      const [tiny, huge, nowhere] = sets.definitions.value;
      expect(tiny.display.radius).toBe(MIN_CIRCLE_RADIUS);
      expect(huge.display.radius).toBe(MAX_CIRCLE_RADIUS);
      expect(nowhere.display.at).toEqual({ x: 0, y: 0 });
    });

    it('reports the diff against what was held, not the whole write', () => {
      const sets = createSetDefinitions();
      sets.setAll([definitionOf('kept', 'A'), definitionOf('dropped', 'B')]);
      const changes = recordChanges(sets);

      sets.setAll([definitionOf('kept', 'A'), definitionOf('arriving', 'C')]);

      expect(changes).toEqual([
        { added: [definitionOf('arriving', 'C')], removedIds: ['dropped'] },
      ]);
    });

    it('commits the display of a set that survived the write, which moved it', () => {
      const sets = createSetDefinitions();
      sets.setAll([definitionOf('kept', 'A')]);
      const committed = vi.fn();
      sets.events.subscribe('onDisplayCommitted', committed);

      sets.setAll([definitionOf('kept', 'A', { at: { x: 40, y: 40 } })]);

      expect(committed).toHaveBeenCalledWith(['kept']);
    });
  });

  describe('display mutators', () => {
    it('leaves a gesture against a removed set doing nothing', () => {
      const sets = filledTo(1);
      const [only] = sets.definitions.value;
      const committed = vi.fn();
      sets.events.subscribe('onDisplayCommitted', committed);
      sets.removeDefinition(only.id);

      sets.moveDefinition(only.id, { x: 10, y: 10 });
      sets.placeDefinition(only.id, { x: 10, y: 10 });
      sets.resizeDefinition(only.id, 100);
      sets.commitDisplay([only.id]);

      expect(committed).not.toHaveBeenCalled();
    });

    it('clamps a resize the same way a decode is clamped', () => {
      const sets = filledTo(1);
      const [only] = sets.definitions.value;

      sets.resizeDefinition(only.id, 1);

      expect(only.display.radius).toBe(MIN_CIRCLE_RADIUS);
    });

    it('moves by a delta and places at a point', () => {
      const sets = filledTo(1);
      const [only] = sets.definitions.value;

      sets.moveDefinition(only.id, { x: 5, y: -5 });
      expect(only.display.at).toEqual({ x: 5, y: -5 });

      sets.placeDefinition(only.id, { x: 100, y: 100 });
      expect(only.display.at).toEqual({ x: 100, y: 100 });
    });

    it('reports the settled gesture once, and only for sets it still holds', () => {
      const sets = filledTo(2);
      const [first, second] = sets.definitions.value;
      const committed = vi.fn();
      sets.events.subscribe('onDisplayCommitted', committed);

      sets.commitDisplay([first.id, 'not-a-set', second.id]);

      expect(committed).toHaveBeenCalledExactlyOnceWith([first.id, second.id]);
    });
  });
});
