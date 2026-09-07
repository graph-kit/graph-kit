import { describe, expect, it } from 'vitest';

import { mathJsonToLatex } from './dnf.ts';

describe(mathJsonToLatex, () => {
  it('writes the universal set back as its latex symbol', () => {
    expect(mathJsonToLatex('Omega')).toBe('\\Omega');
    expect(mathJsonToLatex(['Negation', 'Omega'])).toBe('\\neg \\Omega');
    expect(mathJsonToLatex(['Union', 'A', 'Omega'])).toBe('A \\cup \\Omega');
  });

  it('leaves a set label as the latex it already is', () => {
    expect(mathJsonToLatex('A')).toBe('A');
  });
});
