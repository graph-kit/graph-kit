import { describe, expect, it } from 'vitest';

import {
  getClassPeriod,
  isChainPeriodic,
  levelStates,
} from './usePeriodicity.ts';

describe('levelStates', () => {
  it('levels each state by its distance from the start', () => {
    const levels = levelStates('a', new Set(['a', 'b', 'c']), {
      a: ['b'],
      b: ['c'],
      c: ['a'],
    });

    expect([...levels]).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('takes the shortest route to a state, not the first', () => {
    const levels = levelStates('a', new Set(['a', 'b', 'c']), {
      a: ['b', 'c'],
      b: ['c'],
      c: [],
    });

    expect(levels.get('c')).toBe(1);
  });

  it('never leaves the class', () => {
    const levels = levelStates('a', new Set(['a', 'b']), {
      a: ['b', 'outside'],
      b: [],
      outside: [],
    });

    expect([...levels.keys()]).toEqual(['a', 'b']);
  });
});

describe('getClassPeriod', () => {
  it('reports 1 for a self loop', () => {
    expect(getClassPeriod(new Set(['a']), { a: ['a'] })).toBe(1);
  });

  it('reports the cycle length when every route around is the same length', () => {
    const period = getClassPeriod(new Set(['a', 'b', 'c']), {
      a: ['b'],
      b: ['c'],
      c: ['a'],
    });

    expect(period).toBe(3);
  });

  it('reports 2 for a pair that can only swap back and forth', () => {
    expect(getClassPeriod(new Set(['a', 'b']), { a: ['b'], b: ['a'] })).toBe(2);
  });

  it('reports 1 once a shortcut makes the cycle lengths coprime', () => {
    const period = getClassPeriod(new Set(['a', 'b', 'c']), {
      a: ['b', 'a'],
      b: ['c'],
      c: ['a'],
    });

    expect(period).toBe(1);
  });

  it('takes the gcd of cycles that share a divisor', () => {
    const period = getClassPeriod(new Set(['a', 'b', 'c', 'd']), {
      a: ['b'],
      b: ['a', 'c'],
      c: ['d'],
      d: ['a'],
    });

    expect(period).toBe(2);
  });

  it('ignores transitions that leave the class', () => {
    const period = getClassPeriod(new Set(['a', 'b']), {
      a: ['b', 'outside'],
      b: ['a'],
      outside: ['a'],
    });

    expect(period).toBe(2);
  });

  it('reports 0 for a class with no transition of its own', () => {
    expect(getClassPeriod(new Set(['a']), { a: [] })).toBe(0);
    expect(getClassPeriod(new Set(), {})).toBe(0);
  });
});

describe('isChainPeriodic', () => {
  it('is true when any class has a period above 1', () => {
    expect(isChainPeriodic([1, 1, 3])).toBe(true);
  });

  it('is false when every class is aperiodic', () => {
    expect(isChainPeriodic([1, 1])).toBe(false);
  });

  it('is false for a chain with no recurrent classes', () => {
    expect(isChainPeriodic([])).toBe(false);
  });
});
