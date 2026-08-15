import { CoreNode } from '@graph/primitives/types';
import { describe, expect, it } from 'vitest';

import { createNodePaintOrder } from './nodePaintOrder.ts';
import { getNodePaintPriorities } from './nodePaintPriority.ts';

const nodes =
  (...ids: string[]) =>
  () =>
    ids.map((id) => ({ id })) as readonly CoreNode[];

describe(createNodePaintOrder, () => {
  it('puts a promoted node in front of every other', () => {
    const paintOrder = createNodePaintOrder();
    paintOrder.promote('b');

    expect(paintOrder.of('b')).toBeGreaterThan(paintOrder.of('a'));
  });

  it('puts the most recently promoted in front of an earlier one', () => {
    const paintOrder = createNodePaintOrder();
    paintOrder.promote('a');
    paintOrder.promote('b');

    expect(paintOrder.of('b')).toBeGreaterThan(paintOrder.of('a'));
  });

  // hovering back and forth is ordinary, and each pass has to win outright
  it('promotes a node that was already promoted once', () => {
    const paintOrder = createNodePaintOrder();
    paintOrder.promote('a');
    paintOrder.promote('b');
    paintOrder.promote('a');

    expect(paintOrder.of('a')).toBeGreaterThan(paintOrder.of('b'));
  });
});

describe(getNodePaintPriorities, () => {
  it('scores an unhovered graph in the order the graph reports it', () => {
    const scores = getNodePaintPriorities({
      nodes: nodes('a', 'b', 'c'),
      paintOrder: createNodePaintOrder(),
    });

    expect(scores.get('a')).toBeLessThan(scores.get('b')!);
    expect(scores.get('b')).toBeLessThan(scores.get('c')!);
  });

  it('scores a promoted node above every other', () => {
    const paintOrder = createNodePaintOrder();
    paintOrder.promote('a');

    const scores = getNodePaintPriorities({
      nodes: nodes('a', 'b', 'c'),
      paintOrder,
    });

    expect(scores.get('a')).toBeGreaterThan(scores.get('b')!);
    expect(scores.get('a')).toBeGreaterThan(scores.get('c')!);
  });

  it('normalises scores below one however many promotions have happened', () => {
    const paintOrder = createNodePaintOrder();
    for (let i = 0; i < 50; i++) paintOrder.promote('a');

    const scores = getNodePaintPriorities({
      nodes: nodes('a', 'b'),
      paintOrder,
    });

    for (const score of scores.values()) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(1);
    }
  });
});
