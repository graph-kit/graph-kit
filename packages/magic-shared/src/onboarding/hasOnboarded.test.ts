import { afterEach, describe, expect, it } from 'vitest';

import { hasOnboarded, markOnboarded } from './hasOnboarded.ts';

afterEach(() => localStorage.clear());

describe('hasOnboarded', () => {
  it('reads false for a browser that has never been here', () => {
    expect(hasOnboarded('graph')).toBe(false);
  });

  it('reads true once marked', () => {
    markOnboarded('graph');

    expect(hasOnboarded('graph')).toBe(true);
  });

  it('leaves every other card alone', () => {
    markOnboarded('graph');

    expect(hasOnboarded('sets')).toBe(false);
  });

  it('reads false for anything else stored under the key', () => {
    localStorage.setItem('has-onboarded-graph', 'yes');

    expect(hasOnboarded('graph')).toBe(false);
  });

  it('survives being marked more than once', () => {
    markOnboarded('graph');
    markOnboarded('graph');

    expect(localStorage.getItem('has-onboarded-graph')).toBe('true');
  });
});
