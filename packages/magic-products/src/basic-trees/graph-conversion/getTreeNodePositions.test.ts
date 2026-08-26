import { describe, expect, it } from 'vitest';

import { TreeNode } from '../tree/TreeNode.ts';
import { getTreeNodePositions } from './getTreeNodePositions.ts';

const X_OFFSET = 160;
const Y_OFFSET = 200;
const ORIGIN = { x: 0, y: 0 };

const node = (
  id: string,
  value: number,
  left?: TreeNode,
  right?: TreeNode,
): TreeNode => {
  const treeNode = new TreeNode({ id, value });
  treeNode.left = left;
  treeNode.right = right;
  return treeNode;
};

/** a tree of the given height with every slot filled */
const perfectTree = (
  height: number,
  counter = { next: 0 },
): TreeNode | undefined => {
  if (height === 0) return undefined;
  const id = String(counter.next++);
  return node(
    id,
    counter.next,
    perfectTree(height - 1, counter),
    perfectTree(height - 1, counter),
  );
};

const place = (node: TreeNode, xOffset = X_OFFSET, origin = ORIGIN) =>
  getTreeNodePositions({
    root: node,
    rootPosition: origin,
    xOffset,
    yOffset: Y_OFFSET,
  });

/** the x values on the lowest drawn row, left to right */
const deepestRowXs = (positions: Map<TreeNode, { x: number; y: number }>) => {
  const coords = [...positions.values()];
  const deepestY = Math.max(...coords.map(({ y }) => y));
  return coords
    .filter(({ y }) => y === deepestY)
    .map(({ x }) => x)
    .sort((previous, next) => previous - next);
};

const gapsBetween = (values: number[]) =>
  values.slice(1).map((value, index) => value - values[index]);

describe('getTreeNodePositions', () => {
  it('draws a lone node at the coordinates it was given', () => {
    const root = node('a', 1);
    const positions = place(root, X_OFFSET, { x: 800, y: 400 });

    expect(positions.get(root)).toEqual({ x: 800, y: 400 });
    expect(positions.size).toBe(1);
  });

  it('places every node in the tree', () => {
    const root = perfectTree(4)!;
    expect(place(root).size).toBe(15);
  });

  it('drops each level one yOffset below its parent', () => {
    const leaf = node('d', 4);
    const child = node('b', 2, leaf);
    const root = node('a', 1, child);
    const positions = place(root, X_OFFSET, { x: 0, y: 50 });

    expect(positions.get(root)?.y).toBe(50);
    expect(positions.get(child)?.y).toBe(250);
    expect(positions.get(leaf)?.y).toBe(450);
  });

  it('puts the left child left of its parent and the right child right', () => {
    const left = node('b', 2);
    const right = node('c', 3);
    const root = node('a', 1, left, right);
    const positions = place(root);

    expect(positions.get(left)!.x).toBeLessThan(positions.get(root)!.x);
    expect(positions.get(right)!.x).toBeGreaterThan(positions.get(root)!.x);
  });

  it('offsets an only child rather than centering it under the parent', () => {
    const right = node('c', 3);
    const root = node('a', 1, undefined, right);
    const positions = place(root);

    expect(positions.get(right)!.x).not.toBe(positions.get(root)!.x);
  });

  it('mirrors an only-left child against an only-right child', () => {
    const onlyLeft = node('b', 2);
    const onlyRight = node('c', 3);
    const leftPositions = place(node('a', 1, onlyLeft));
    const rightPositions = place(node('a', 1, undefined, onlyRight));

    expect(leftPositions.get(onlyLeft)!.x).toBe(
      -rightPositions.get(onlyRight)!.x,
    );
  });

  // the spacing contract: whatever the depth, adjacent leaves land exactly
  // xOffset apart, which is what keeps deep trees legible
  for (const height of [2, 3, 4, 5]) {
    it(`spaces the deepest row exactly xOffset apart at height ${height}`, () => {
      const positions = place(perfectTree(height)!);
      const gaps = gapsBetween(deepestRowXs(positions));

      expect(gaps.length).toBe(Math.pow(2, height - 1) - 1);
      for (const gap of gaps) expect(gap).toBe(X_OFFSET);
    });
  }

  it('halves the sibling spacing on each level down', () => {
    const leftLeaf = node('d', 4);
    const rightLeaf = node('e', 5);
    const left = node('b', 2, leftLeaf, rightLeaf);
    const right = node('c', 3);
    const root = node('a', 1, left, right);
    const positions = place(root);

    const topGap = positions.get(right)!.x - positions.get(left)!.x;
    const bottomGap = positions.get(rightLeaf)!.x - positions.get(leftLeaf)!.x;

    expect(topGap).toBe(bottomGap * 2);
  });

  it('widens the root spread as the tree gets deeper', () => {
    const rootSpread = (height: number) => {
      const root = perfectTree(height)!;
      const positions = place(root);
      return positions.get(root.right!)!.x - positions.get(root.left!)!.x;
    };

    expect(rootSpread(3)).toBe(rootSpread(2) * 2);
    expect(rootSpread(4)).toBe(rootSpread(3) * 2);
  });

  it('keeps a shallow tree narrow regardless of how wide a deep one gets', () => {
    const shallow = perfectTree(2)!;
    const positions = place(shallow);

    expect(positions.get(shallow.left!)!.x).toBe(-X_OFFSET / 2);
    expect(positions.get(shallow.right!)!.x).toBe(X_OFFSET / 2);
  });

  it('rounds every coordinate to a whole pixel', () => {
    // an odd xOffset halved down four levels lands on fractions
    const positions = place(perfectTree(5)!, 5);

    for (const { x, y } of positions.values()) {
      expect(Number.isInteger(x)).toBe(true);
      expect(Number.isInteger(y)).toBe(true);
    }
  });
});
