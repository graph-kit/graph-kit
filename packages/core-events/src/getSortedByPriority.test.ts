import { describe, expect, it, vi } from 'vitest';

import { getSortedByPriority } from './getSortedByPriority.ts';

const item = (id: string, before: string[] = []) => ({
  id,
  priority: { before },
});

describe(getSortedByPriority, () => {
  it('returns a new array without mutating the input', () => {
    const input = [item('b', ['a']), item('a')];
    const original = [...input];
    const result = getSortedByPriority(input);
    expect(input).toEqual(original);
    expect(result).not.toBe(input);
  });

  it('returns items in original order when there are no priority constraints', () => {
    const input = [item('a'), item('b'), item('c')];
    expect(getSortedByPriority(input).map((i) => i.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('places an item before the one it declares in before', () => {
    const input = [item('b'), item('a', ['b'])];
    expect(getSortedByPriority(input).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('handles a chain: a before b before c', () => {
    const input = [item('c'), item('b', ['c']), item('a', ['b'])];
    expect(getSortedByPriority(input).map((i) => i.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('matches a hub-level id prefix (e.g. "drag" matches "drag:mousedown")', () => {
    const input = [item('drag:mousedown'), item('focus', ['drag'])];
    expect(getSortedByPriority(input).map((i) => i.id)).toEqual([
      'focus',
      'drag:mousedown',
    ]);
  });

  it('does not match a partial prefix that is not a segment boundary', () => {
    const input = [item('dragging'), item('focus', ['drag'])];
    expect(getSortedByPriority(input).map((i) => i.id)).toEqual([
      'dragging',
      'focus',
    ]);
  });

  it('handles multiple before targets', () => {
    const input = [item('b'), item('c'), item('a', ['b', 'c'])];
    const result = getSortedByPriority(input).map((i) => i.id);
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('b'));
    expect(result.indexOf('a')).toBeLessThan(result.indexOf('c'));
  });

  it('appends items involved in a cycle without throwing and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = [item('a', ['b']), item('b', ['a'])];
    const result = getSortedByPriority(input);
    expect(result).toHaveLength(2);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cycle detected'),
    );
    warnSpy.mockRestore();
  });

  it('handles an empty array', () => {
    expect(getSortedByPriority([])).toEqual([]);
  });

  it('handles items with undefined id gracefully', () => {
    const input = [{ id: undefined, priority: { before: [] } }, item('a', [])];
    const result = getSortedByPriority(input);
    expect(result).toHaveLength(2);
  });
});
