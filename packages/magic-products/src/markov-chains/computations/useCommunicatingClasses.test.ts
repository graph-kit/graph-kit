import { describe, expect, it } from 'vitest';

import { toCommunicatingClasses } from './useCommunicatingClasses.ts';

describe('toCommunicatingClasses', () => {
  it('closes a class nothing leaves', () => {
    const classes = toCommunicatingClasses(
      [[{ id: 'a' }, { id: 'b' }]],
      new Map([[0, new Set<number>()]]),
    );

    expect(classes).toEqual([{ states: new Set(['a', 'b']), closed: true }]);
  });

  it('leaves a class open when a transition reaches another class', () => {
    const classes = toCommunicatingClasses(
      [[{ id: 'a' }], [{ id: 'b' }]],
      new Map([
        [0, new Set([1])],
        [1, new Set<number>()],
      ]),
    );

    expect(
      classes.map((communicatingClass) => communicatingClass.closed),
    ).toEqual([false, true]);
  });

  it('throws when a component has no adjacency entry', () => {
    expect(() => toCommunicatingClasses([[{ id: 'a' }]], new Map())).toThrow();
  });
});
