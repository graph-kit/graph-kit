import { describe, expect, test } from 'vitest';

import { createLabelGenerator } from './label.ts';

describe(createLabelGenerator, () => {
  test('returns the first label in the sequence when no labels are active', () => {
    const generateLabel = createLabelGenerator({
      getLabels: () => [],
      sequence: ['A', 'B', 'C'],
    });
    expect(generateLabel()).toBe('A');
  });

  test('skips labels that are already active', () => {
    const active = ['A'];
    const generateLabel = createLabelGenerator({
      getLabels: () => active,
      sequence: ['A', 'B', 'C'],
    });
    expect(generateLabel()).toBe('B');
  });

  test('wraps around with a prefix once the sequence is exhausted', () => {
    const active = ['A', 'B', 'C'];
    const generateLabel = createLabelGenerator({
      getLabels: () => active,
      sequence: ['A', 'B', 'C'],
    });
    expect(generateLabel()).toBe('AA');
  });

  test('skips prefixed labels that are already active', () => {
    const active = ['A', 'B', 'C', 'AA'];
    const generateLabel = createLabelGenerator({
      getLabels: () => active,
      sequence: ['A', 'B', 'C'],
    });
    expect(generateLabel()).toBe('AB');
  });

  test('each call reflects the current state of getLabels', () => {
    const active: string[] = [];
    const generateLabel = createLabelGenerator({
      getLabels: () => active,
      sequence: ['A', 'B', 'C'],
    });

    expect(generateLabel()).toBe('A');
    active.push('A');
    expect(generateLabel()).toBe('B');
    active.push('B');
    expect(generateLabel()).toBe('C');
  });
});
