import { FrameCollector } from '@magic/shared/simulation';
import { describe, expect, test } from 'vitest';

import { AVLFrame } from '../simulations/frames.ts';
import { AVLTree } from './AVLTree.ts';
import { TreeNode } from './TreeNode.ts';
import { getBalanceFactor } from './getBalanceFactor.ts';

/** attaches a collector and hands back the frames it accumulates */
const collectFrames = (tree: AVLTree) => {
  const frames: AVLFrame[] = [];
  const collector: FrameCollector<AVLFrame> = {
    add: (frame) => frames.push(frame),
  };

  tree.attachFrameCollector(collector);
  return frames;
};

const inOrder = (node: TreeNode | undefined, out: number[] = []) => {
  if (!node) return out;
  inOrder(node.left, out);
  out.push(node.value);
  inOrder(node.right, out);
  return out;
};

const everyNode = (node: TreeNode | undefined, out: TreeNode[] = []) => {
  if (!node) return out;
  out.push(node);
  everyNode(node.left, out);
  everyNode(node.right, out);
  return out;
};

const expectValidAvl = (tree: AVLTree, expectedValues: number[]) => {
  const nodes = everyNode(tree.root);

  expect(inOrder(tree.root)).toEqual(
    [...expectedValues].sort((previous, next) => previous - next),
  );
  expect(nodes).toHaveLength(expectedValues.length);

  const unbalanced = nodes.filter(
    (node) => Math.abs(getBalanceFactor(node)) > 1,
  );
  expect(unbalanced.map((node) => node.value)).toEqual([]);

  const ids = new Set(nodes.map((node) => node.id));
  expect(ids.size).toBe(nodes.length);
};

const insertAll = (tree: AVLTree, values: number[]) => {
  for (const value of values) {
    tree.insert({ value, id: `n-${value}` });
  }
};

/** deterministic so a failing fuzz case can be replayed from its seed */
const makePrng = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

describe('AVLTree', () => {
  describe('insert', () => {
    test('ascending inserts stay balanced', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      const values = Array.from({ length: 64 }, (_, i) => i + 1);
      insertAll(tree, values);

      expectValidAvl(tree, values);
    });

    test('descending inserts stay balanced', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      const values = Array.from({ length: 64 }, (_, i) => 64 - i);
      insertAll(tree, values);

      expectValidAvl(tree, values);
    });

    test('left-right double rotation lifts the grandchild', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [30, 10, 20]);

      expect(tree.root?.value).toBe(20);
      expectValidAvl(tree, [30, 10, 20]);
    });

    test('right-left double rotation lifts the grandchild', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [10, 30, 20]);

      expect(tree.root?.value).toBe(20);
      expectValidAvl(tree, [10, 30, 20]);
    });

    test('duplicate values are rejected', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [10, 20, 10]);

      expectValidAvl(tree, [10, 20]);
      expect(
        frames.some((frame) => frame.action === 'compare-duplicate-found'),
      ).toBe(true);
    });
  });

  describe('remove', () => {
    test('removes a leaf', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [20, 10, 30]);
      tree.remove('n-10');

      expectValidAvl(tree, [20, 30]);
    });

    test('removes a node with one child', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [20, 10, 30, 40]);
      tree.remove('n-30');

      expectValidAvl(tree, [20, 10, 40]);
    });

    test('removes a node with two children, keeping successor identity', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [20, 10, 30, 25, 40]);
      tree.remove('n-30');

      expectValidAvl(tree, [20, 10, 25, 40]);

      const successor = everyNode(tree.root).find((node) => node.value === 25);
      expect(successor?.id).toBe('n-25');
    });

    test('removing the root promotes the successor', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [20, 10, 30]);
      tree.remove('n-20');

      expect(tree.root?.value).toBe(30);
      expectValidAvl(tree, [10, 30]);
    });

    test('rebalances after a removal unbalances the tree', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [50, 25, 75, 10, 30, 60, 90, 5]);
      tree.remove('n-60');
      tree.remove('n-90');

      expectValidAvl(tree, [50, 25, 75, 10, 30, 5]);
    });

    test('removing an id that is not in the tree throws', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [20, 10, 30]);

      expect(() => tree.remove('n-999')).toThrow();
      expectValidAvl(tree, [20, 10, 30]);
    });

    test('emptying the tree one value at a time', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      const values = [50, 25, 75, 10, 30, 60, 90];
      insertAll(tree, values);

      const remaining = [...values];
      for (const value of values) {
        tree.remove(`n-${value}`);
        remaining.splice(remaining.indexOf(value), 1);
        expectValidAvl(tree, remaining);
      }

      expect(tree.root).toBeUndefined();
    });
  });

  describe('frames', () => {
    test('a rotation frame snapshots the tree after the rotation', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [30, 20, 10]);

      const balanceIndex = frames.findIndex(
        (frame) => frame.action === 'balance',
      );
      const rotationIndex = frames.findIndex(
        (frame) => frame.action === 'rotation',
      );

      expect(rotationIndex).toBe(balanceIndex + 1);
      expect(frames[balanceIndex].root?.value).toBe(30);
      expect(frames[rotationIndex].root?.value).toBe(20);
    });

    test('a double rotation emits one rotation frame per rotation', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [30, 10, 20]);

      const balanceFrames = frames.filter(
        (frame) => frame.action === 'balance',
      );
      const rotationFrames = frames.filter(
        (frame) => frame.action === 'rotation',
      );

      expect(balanceFrames).toHaveLength(1);
      expect(balanceFrames[0]).toMatchObject({ method: 'left-right' });
      expect(rotationFrames).toHaveLength(2);
      expect(rotationFrames.map((frame) => frame.side)).toEqual([
        'left',
        'right',
      ]);
    });

    test('a balance frame carries the balance factor of the child it leans on', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [30, 20, 10]);

      const balanceFrames = frames.filter(
        (frame) => frame.action === 'balance',
      );

      expect(balanceFrames).toHaveLength(1);
      expect(balanceFrames[0]).toMatchObject({
        method: 'left-left',
        childBalanceFactor: 1,
      });
    });

    test('removal can leave a left left child perfectly balanced', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [50, 30, 70, 20, 40]);
      frames.length = 0;

      // 50 loses its only right child, so it leans left on a child holding 20 and 40
      tree.remove('n-70');

      const balanceFrames = frames.filter(
        (frame) => frame.action === 'balance',
      );

      expect(balanceFrames).toHaveLength(1);
      expect(balanceFrames[0]).toMatchObject({
        method: 'left-left',
        childBalanceFactor: 0,
      });
      expectValidAvl(tree, [50, 30, 20, 40]);
    });

    test('the removed node is gone from the remove frame snapshot', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [20, 10, 30]);
      tree.remove('n-10');

      const removeFrame = frames.find((frame) => frame.action === 'remove');

      expect(removeFrame).toBeDefined();
      expect(inOrder(removeFrame?.root)).toEqual([20, 30]);
    });

    test('the replacement is reported before the removal, tree still intact', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [20, 10, 30, 25, 40]);

      frames.length = 0;
      tree.remove('n-30');

      const replacementIndex = frames.findIndex(
        (frame) => frame.action === 'find-replacement',
      );
      const removeIndex = frames.findIndex(
        (frame) => frame.action === 'remove',
      );
      const replacementFrame = frames[replacementIndex];

      expect(removeIndex).toBe(replacementIndex + 1);
      expect(replacementFrame).toMatchObject({
        method: 'successor',
        removedNode: { id: 'n-30' },
        replacementNode: { id: 'n-40' },
      });
      expect(inOrder(replacementFrame.root)).toEqual([10, 20, 25, 30, 40]);
    });

    test('a leaf removal reports that nothing takes its place', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [20, 10, 30]);

      frames.length = 0;
      tree.remove('n-10');

      const replacementFrame = frames.find(
        (frame) => frame.action === 'find-replacement',
      );

      expect(replacementFrame).toMatchObject({
        method: 'leaf',
        removedNode: { id: 'n-10' },
      });
    });

    test('one balance check is reported after the removal', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [50, 25, 75, 10, 30, 60, 90, 5]);

      frames.length = 0;
      tree.remove('n-60');

      const removeIndex = frames.findIndex(
        (frame) => frame.action === 'remove',
      );
      const checks = frames.filter((frame) => frame.action === 'balance-check');

      expect(checks).toHaveLength(1);
      expect(frames.indexOf(checks[0])).toBeGreaterThan(removeIndex);
    });

    test('the balance check snapshots the tree before any rebalancing', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [50, 25, 75, 10, 30, 60, 90, 5]);
      tree.remove('n-60');

      frames.length = 0;
      tree.remove('n-90');

      const checks = frames.filter((frame) => frame.action === 'balance-check');
      const rotationIndex = frames.findIndex(
        (frame) => frame.action === 'rotation',
      );

      expect(checks).toHaveLength(1);
      expect(rotationIndex).toBeGreaterThan(frames.indexOf(checks[0]));

      const unbalanced = everyNode(checks[0].root).filter(
        (node) => Math.abs(getBalanceFactor(node)) > 1,
      );
      expect(unbalanced.map((node) => node.id)).toEqual(['n-50']);
    });

    test('the insertion ends on a confirmation frame with a balanced snapshot', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [30, 20]);

      frames.length = 0;
      tree.insert({ value: 10, id: 'n-10' });

      const completions = frames.filter(
        (frame) => frame.action === 'insert-complete',
      );

      expect(completions).toHaveLength(1);
      expect(frames.at(-1)).toBe(completions[0]);

      const unbalanced = everyNode(completions[0].root).filter(
        (node) => Math.abs(getBalanceFactor(node)) > 1,
      );
      expect(unbalanced).toEqual([]);
    });

    test('a rejected duplicate does not report a completed insertion', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [30, 20]);

      frames.length = 0;
      tree.insert({ value: 20, id: 'n-20-again' });

      expect(
        frames.some((frame) => frame.action === 'compare-duplicate-found'),
      ).toBe(true);
      expect(frames.some((frame) => frame.action === 'insert-complete')).toBe(
        false,
      );
    });

    test('the removal ends on a confirmation frame with a balanced snapshot', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [50, 25, 75, 10, 30, 60, 90, 5]);
      tree.remove('n-60');

      frames.length = 0;
      tree.remove('n-90');

      const completions = frames.filter(
        (frame) => frame.action === 'remove-complete',
      );

      expect(completions).toHaveLength(1);
      expect(frames.at(-1)).toBe(completions[0]);

      const unbalanced = everyNode(completions[0].root).filter(
        (node) => Math.abs(getBalanceFactor(node)) > 1,
      );
      expect(unbalanced).toEqual([]);
    });

    test('rebalancing rotations are reported after the removal', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [50, 25, 75, 10, 30, 60, 90, 5]);

      frames.length = 0;
      tree.remove('n-60');
      tree.remove('n-90');

      const removeIndex = frames.findIndex(
        (frame) => frame.action === 'remove',
      );
      const rotationIndex = frames.findIndex(
        (frame) => frame.action === 'rotation',
      );

      expect(removeIndex).toBeGreaterThanOrEqual(0);
      expect(rotationIndex).toBeGreaterThan(removeIndex);
    });
  });

  test('fuzz: inserts and removals hold the AVL invariants', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const random = makePrng(seed);
      const tree = new AVLTree();
      collectFrames(tree);

      const live = new Set<number>();
      for (let step = 0; step < 50; step++) {
        const value = Math.floor(random() * 120);
        tree.insert({ value, id: `n-${value}` });
        live.add(value);
      }

      expectValidAvl(tree, [...live]);

      for (const value of [...live].filter(() => random() < 0.5)) {
        tree.remove(`n-${value}`);
        live.delete(value);
      }

      expectValidAvl(tree, [...live]);
    }
  });
});
