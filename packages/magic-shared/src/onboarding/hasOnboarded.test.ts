import { afterEach, describe, expect, it } from 'vitest';

import { hasOnboarded, markOnboarded } from './hasOnboarded.ts';

afterEach(() => localStorage.clear());

describe('hasOnboarded', () => {
  it('reads false for a browser that has never been here', () => {
    expect(hasOnboarded('traversals')).toBe(false);
  });

  it('reads true once marked', () => {
    markOnboarded('traversals');

    expect(hasOnboarded('traversals')).toBe(true);
  });

  it('leaves every other product alone', () => {
    markOnboarded('traversals');

    expect(hasOnboarded('path-finding')).toBe(false);
  });

  it('reads false for anything else stored under the key', () => {
    localStorage.setItem('has-onboarded-traversals', 'yes');

    expect(hasOnboarded('traversals')).toBe(false);
  });

  it('survives being marked more than once', () => {
    markOnboarded('traversals');
    markOnboarded('traversals');

    expect(localStorage.getItem('has-onboarded-traversals')).toBe('true');
  });
});
