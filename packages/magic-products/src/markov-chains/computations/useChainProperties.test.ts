import { describe, expect, it } from 'vitest';

import { isAbsorbing, isErgodic, isReducible } from './useChainProperties.ts';

const communicatingClass = (...states: string[]) => ({
  states: new Set(states),
  closed: true,
});

describe('isReducible', () => {
  it('is true once the chain breaks into more than one class', () => {
    expect(
      isReducible([communicatingClass('a'), communicatingClass('b')]),
    ).toBe(true);
  });

  it('is false for a chain that is one class', () => {
    expect(isReducible([communicatingClass('a', 'b')])).toBe(false);
  });
});

describe('isAbsorbing', () => {
  it('is true when every recurrent class is a single state', () => {
    expect(isAbsorbing([new Set(['a']), new Set(['b'])])).toBe(true);
  });

  it('is false when a recurrent class the chain can land in holds more than one state', () => {
    expect(isAbsorbing([new Set(['a']), new Set(['b', 'c'])])).toBe(false);
  });

  it('is false for a chain with nothing to absorb into', () => {
    expect(isAbsorbing([])).toBe(false);
  });
});

describe('isErgodic', () => {
  it('needs the chain to be one class and aperiodic', () => {
    expect(isErgodic([communicatingClass('a', 'b')], false)).toBe(true);
  });

  it('is false while the chain is still periodic', () => {
    expect(isErgodic([communicatingClass('a', 'b')], true)).toBe(false);
  });

  it('is false for a reducible chain', () => {
    expect(
      isErgodic([communicatingClass('a'), communicatingClass('b')], false),
    ).toBe(false);
  });

  it('is false for an empty chain', () => {
    expect(isErgodic([], false)).toBe(false);
  });
});
