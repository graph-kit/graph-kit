import { afterEach, describe, expect, it } from 'vitest';

import { hasOnboarded, markOnboarded } from './hasOnboarded.ts';

const KEY = 'has-onboarded';

afterEach(() => localStorage.clear());

describe('hasOnboarded', () => {
  it('reads false for a browser that has never been here', () => {
    expect(hasOnboarded()).toBe(false);
  });

  it('reads true once marked', () => {
    markOnboarded();

    expect(hasOnboarded()).toBe(true);
  });

  it('reads false for anything else stored under the key', () => {
    localStorage.setItem(KEY, 'yes');

    expect(hasOnboarded()).toBe(false);
  });

  it('survives being marked more than once', () => {
    markOnboarded();
    markOnboarded();

    expect(localStorage.getItem(KEY)).toBe('true');
  });
});
