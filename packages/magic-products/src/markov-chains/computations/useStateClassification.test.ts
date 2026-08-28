import { describe, expect, it } from 'vitest';

import {
  getAbsorbingStates,
  getRecurrentClasses,
  getTransientStates,
} from './useStateClassification.ts';

describe('getRecurrentClasses', () => {
  it('keeps only the closed classes', () => {
    const recurrentClasses = getRecurrentClasses([
      { states: new Set(['a']), closed: false },
      { states: new Set(['b', 'c']), closed: true },
    ]);

    expect(recurrentClasses).toEqual([new Set(['b', 'c'])]);
  });
});

describe('getTransientStates', () => {
  it('is every state left over once the recurrent ones are taken', () => {
    const transientStates = getTransientStates(
      ['a', 'b', 'c'],
      new Set(['b', 'c']),
    );

    expect(transientStates).toEqual(new Set(['a']));
  });
});

describe('getAbsorbingStates', () => {
  it('takes the recurrent classes holding a single state', () => {
    const absorbingStates = getAbsorbingStates([
      new Set(['a']),
      new Set(['b', 'c']),
      new Set(['d']),
    ]);

    expect(absorbingStates).toEqual(new Set(['a', 'd']));
  });

  it('is empty when every recurrent class holds more than one state', () => {
    expect(getAbsorbingStates([new Set(['a', 'b'])])).toEqual(new Set());
  });
});
