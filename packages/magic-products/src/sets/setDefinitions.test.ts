import { describe, expect, it } from 'vitest';

import { createSetDefinitions } from './setDefinitions.ts';
import { MAX_SETS } from './sets/other/constants.ts';

const at = { x: 0, y: 0 };

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
});
