import { describe, expect, it } from 'vitest';

import { TreeNode } from './TreeNode.ts';
import { TreeNodeArray, treeNodeToArray } from './treeNodeToArray.ts';

const node = (id: string, left?: TreeNode, right?: TreeNode): TreeNode => {
  const treeNode = new TreeNode({ id, value: 0 });
  treeNode.left = left;
  treeNode.right = right;
  return treeNode;
};

const idsIn = (array: TreeNodeArray) => array.map((entry) => entry?.id ?? null);

const nodesIn = (root: TreeNode | undefined): TreeNode[] =>
  root ? [root, ...nodesIn(root.left), ...nodesIn(root.right)] : [];

/**
 * every node sits at the heap index its path implies, which is the whole point of
 * the array form and the only thing callers may rely on
 */
const expectHeapLayout = (
  array: TreeNodeArray,
  node: TreeNode | undefined,
  index: number,
) => {
  if (!node) return;
  expect(array[index]).toBe(node);
  expectHeapLayout(array, node.left, 2 * index + 1);
  expectHeapLayout(array, node.right, 2 * index + 2);
};

describe('treeNodeToArray', () => {
  it('returns nothing for an empty tree', () => {
    expect(treeNodeToArray(undefined)).toEqual([]);
  });

  it('puts the root at index 0', () => {
    const root = node('a');
    expect(treeNodeToArray(root)[0]).toBe(root);
  });

  it('puts children at 2i+1 and 2i+2', () => {
    const left = node('b');
    const right = node('c');
    const array = treeNodeToArray(node('a', left, right));

    expect(array[1]).toBe(left);
    expect(array[2]).toBe(right);
  });

  it('leaves a missing left child empty without shifting the right one', () => {
    const right = node('c');
    const array = treeNodeToArray(node('a', undefined, right));

    expect(array[1]).toBeUndefined();
    expect(array[2]).toBe(right);
  });

  it('lays out a full three level tree', () => {
    const array = treeNodeToArray(
      node(
        'a',
        node('b', node('d'), node('e')),
        node('c', node('f'), node('g')),
      ),
    );

    expect(idsIn(array).slice(0, 7)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
    ]);
  });

  it('spreads a right leaning chain across widening indices', () => {
    const array = treeNodeToArray(
      node(
        'a',
        undefined,
        node('b', undefined, node('c', undefined, node('d'))),
      ),
    );

    expect(array[0]?.id).toBe('a');
    expect(array[2]?.id).toBe('b');
    expect(array[6]?.id).toBe('c');
    expect(array[14]?.id).toBe('d');
  });

  it('keeps a left leaning chain on odd indices', () => {
    const array = treeNodeToArray(node('a', node('b', node('c'))));

    expect(array[0]?.id).toBe('a');
    expect(array[1]?.id).toBe('b');
    expect(array[3]?.id).toBe('c');
  });

  for (const [shape, root] of [
    ['a lone node', node('a')],
    ['a full tree', node('a', node('b', node('d')), node('c'))],
    ['a right spine', node('a', undefined, node('b', undefined, node('c')))],
    ['a lopsided tree', node('a', node('b', undefined, node('d')), node('c'))],
  ] as const) {
    it(`honours the heap relationship for ${shape}`, () => {
      expectHeapLayout(treeNodeToArray(root), root, 0);
    });

    it(`holds every node of ${shape} exactly once`, () => {
      const array = treeNodeToArray(root);
      const present = array.filter((entry) => entry !== undefined);

      expect(present).toHaveLength(nodesIn(root).length);
      expect(new Set(present).size).toBe(present.length);
    });
  }

  it('fills positions no node occupies with undefined', () => {
    // only the root and its right child exist, so index 1 and everything
    // under the absent left subtree stays empty
    const array = treeNodeToArray(node('a', undefined, node('c')));
    const occupied = new Set([0, 2]);

    for (const [index, entry] of array.entries()) {
      if (occupied.has(index)) expect(entry).toBeDefined();
      else expect(entry).toBeUndefined();
    }
  });
});
