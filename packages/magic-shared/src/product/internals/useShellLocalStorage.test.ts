import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShellFlags } from '../flags.ts';
import { TransitField } from '../types.ts';
import { useShellLocalStorage } from './useShellLocalStorage.ts';

const KEY = 'product-data-avl-trees';
const DEBOUNCE_MS = 500;

const FLAGS: ShellFlags = {
  history: true,
  localStorage: true,
  annotations: true,
  linkSharing: true,
  adjustAnimationSpeed: false,
  jumpToContent: true,
};

/** stands in for a graph whose state moves while a simulation plays */
const movingTransit = () => {
  let state = 'settled';
  const transit: TransitField = {
    encode: () => ({ state }),
    decode: () => {},
  };
  return {
    transit,
    moveTo: (next: string) => (state = next),
  };
};

const saved = () => localStorage.getItem(KEY);

const controls = (transit: TransitField) =>
  useShellLocalStorage('avl-trees', { transit }, FLAGS);

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('invalidate', () => {
  it('persists once the debounce elapses', () => {
    const { transit } = movingTransit();
    controls(transit).invalidate();

    expect(saved()).toBeNull();
    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(saved()).toBe(JSON.stringify({ state: 'settled' }));
  });

  it('writes nothing while suspended, even after the debounce elapses', () => {
    const { transit } = movingTransit();
    const localStorageControls = controls(transit);

    localStorageControls.suspend();
    localStorageControls.invalidate();
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(saved()).toBeNull();
  });
});

describe('suspend', () => {
  it('drops a write scheduled just before it, so no frame mid-change lands', () => {
    const { transit, moveTo } = movingTransit();
    const localStorageControls = controls(transit);

    localStorageControls.invalidate();
    localStorageControls.suspend();
    moveTo('mid-simulation');
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(saved()).toBeNull();
  });

  it('persists what the product settled on, without waiting on a debounce', () => {
    const { transit, moveTo } = movingTransit();
    const localStorageControls = controls(transit);

    const release = localStorageControls.suspend();
    moveTo('mid-simulation');
    moveTo('final tree');
    release();

    expect(saved()).toBe(JSON.stringify({ state: 'final tree' }));
  });

  it('ignores a second release rather than persisting again', () => {
    const { transit, moveTo } = movingTransit();
    const localStorageControls = controls(transit);

    const release = localStorageControls.suspend();
    release();
    moveTo('changed after release');
    release();

    expect(saved()).toBe(JSON.stringify({ state: 'settled' }));
  });

  it('lets invalidate through again once released', () => {
    const { transit, moveTo } = movingTransit();
    const localStorageControls = controls(transit);

    localStorageControls.suspend()();
    moveTo('edited after the simulation');
    localStorageControls.invalidate();
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(saved()).toBe(
      JSON.stringify({ state: 'edited after the simulation' }),
    );
  });
});

describe('without persistence', () => {
  it('hands back a release that does nothing', () => {
    const { transit } = movingTransit();
    const inert = useShellLocalStorage(
      'avl-trees',
      { transit },
      { ...FLAGS, localStorage: false },
    );

    inert.suspend()();
    inert.invalidate();
    vi.advanceTimersByTime(DEBOUNCE_MS);

    expect(saved()).toBeNull();
  });
});
