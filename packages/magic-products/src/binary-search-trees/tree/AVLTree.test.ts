import { FrameCollector } from '@magic/shared/simulation';
import { describe, expect, test } from 'vitest';

import { AVLFrame } from '../simulations/frames.ts';
import { AVLTree } from './AVLTree.ts';
import { TreeNode } from './TreeNode.ts';
import { getBalanceFactor } from './getBalanceFactor.ts';
import { getNodeById } from './getNodeById.ts';
import { getTreeHeight } from './getTreeHeight.ts';
import { isBalanced } from './isBalanced.ts';

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

/** the ordering and bookkeeping every edit holds, balanced or not */
const expectValidBst = (tree: AVLTree, expectedValues: number[]) => {
  const nodes = everyNode(tree.root);

  expect(inOrder(tree.root)).toEqual(
    [...expectedValues].sort((previous, next) => previous - next),
  );
  expect(nodes).toHaveLength(expectedValues.length);

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
    test('keeps every value in order', () => {
      const tree = new AVLTree();

      const values = Array.from({ length: 64 }, (_, i) => i + 1);
      insertAll(tree, values);

      expectValidBst(tree, values);
    });

    test('leaves the tree however the values arrived', () => {
      const tree = new AVLTree();

      insertAll(tree, [10, 20, 30]);

      expect(tree.root?.value).toBe(10);
      expect(getTreeHeight(tree.root)).toBe(3);
    });

    test('sends a duplicate down the right', () => {
      const tree = new AVLTree();

      tree.insert({ value: 10, id: 'first' });
      tree.insert({ value: 20, id: 'n-20' });
      tree.insert({ value: 10, id: 'second' });

      expect(tree.root?.right?.left?.id).toBe('second');
      expectValidBst(tree, [10, 10, 20]);
    });
  });

  describe('remove', () => {
    test('removes a leaf', () => {
      const tree = new AVLTree();

      insertAll(tree, [20, 10, 30]);
      tree.remove('n-10');

      expectValidBst(tree, [20, 30]);
    });

    test('removes a node with one child', () => {
      const tree = new AVLTree();

      insertAll(tree, [20, 10, 30, 40]);
      tree.remove('n-30');

      expectValidBst(tree, [20, 10, 40]);
    });

    test('removes a node with two children, keeping successor identity', () => {
      const tree = new AVLTree();

      insertAll(tree, [20, 10, 30, 25, 40]);
      tree.remove('n-30');

      expectValidBst(tree, [20, 10, 25, 40]);

      const successor = everyNode(tree.root).find((node) => node.value === 25);
      expect(successor?.id).toBe('n-25');
    });

    test('removing the root promotes the successor', () => {
      const tree = new AVLTree();

      insertAll(tree, [20, 10, 30]);
      tree.remove('n-20');

      expect(tree.root?.value).toBe(30);
      expectValidBst(tree, [10, 30]);
    });

    test('removes the node asked for rather than the first of its value', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      tree.insert({ value: 5, id: 'first' });
      tree.insert({ value: 5, id: 'second' });
      tree.insert({ value: 5, id: 'third' });
      // the rotation is what seats an equal value on either side of the root
      tree.balance();

      tree.remove('first');

      expect(getNodeById(tree.root, 'first')).toBeUndefined();
      expect(getNodeById(tree.root, 'second')).toBeDefined();
      expect(getNodeById(tree.root, 'third')).toBeDefined();
      expectValidBst(tree, [5, 5]);
    });

    test('removing an id that is not in the tree throws', () => {
      const tree = new AVLTree();

      insertAll(tree, [20, 10, 30]);

      expect(() => tree.remove('n-999')).toThrow();
      expectValidBst(tree, [20, 10, 30]);
    });

    test('emptying the tree one value at a time', () => {
      const tree = new AVLTree();

      const values = [50, 25, 75, 10, 30, 60, 90];
      insertAll(tree, values);

      const remaining = [...values];
      for (const value of values) {
        tree.remove(`n-${value}`);
        remaining.splice(remaining.indexOf(value), 1);
        expectValidBst(tree, remaining);
      }

      expect(tree.root).toBeUndefined();
    });
  });

  describe('balance', () => {
    test('rotates a leaning chain into a balanced tree', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [10, 20, 30]);
      tree.balance();

      expect(tree.root?.value).toBe(20);
      expect(isBalanced(tree.root)).toBe(true);
      expectValidBst(tree, [10, 20, 30]);
    });

    test('left-right double rotation lifts the grandchild', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [30, 10, 20]);
      tree.balance();

      expect(tree.root?.value).toBe(20);
      expectValidBst(tree, [30, 10, 20]);
    });

    test('right-left double rotation lifts the grandchild', () => {
      const tree = new AVLTree();
      collectFrames(tree);

      insertAll(tree, [10, 30, 20]);
      tree.balance();

      expect(tree.root?.value).toBe(20);
      expectValidBst(tree, [10, 30, 20]);
    });
  });

  describe('frames', () => {
    test('the pass is bracketed by a check and a completion', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [10, 20, 30]);
      tree.balance();

      expect(frames.at(0)?.action).toBe('balance-check');
      expect(frames.at(-1)?.action).toBe('balance-complete');

      const unbalanced = everyNode(frames.at(-1)?.root).filter(
        (node) => Math.abs(getBalanceFactor(node)) > 1,
      );
      expect(unbalanced).toEqual([]);
    });

    test('a rotation frame snapshots the tree after the rotation', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [30, 20, 10]);
      tree.balance();

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
      tree.balance();

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
      tree.balance();

      const balanceFrames = frames.filter(
        (frame) => frame.action === 'balance',
      );

      expect(balanceFrames).toHaveLength(1);
      expect(balanceFrames[0]).toMatchObject({
        method: 'left-left',
        childBalanceFactor: 1,
      });
    });

    test('a left left child can be perfectly balanced', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [50, 30, 70, 20, 40]);
      // 50 loses its only right child, so it leans left on a child holding 20 and 40
      tree.remove('n-70');
      tree.balance();

      const balanceFrames = frames.filter(
        (frame) => frame.action === 'balance',
      );

      expect(balanceFrames).toHaveLength(1);
      expect(balanceFrames[0]).toMatchObject({
        method: 'left-left',
        childBalanceFactor: 0,
      });
      expectValidBst(tree, [50, 30, 20, 40]);
      expect(isBalanced(tree.root)).toBe(true);
    });

    test('the balance check snapshots the tree before any rebalancing', () => {
      const tree = new AVLTree();
      const frames = collectFrames(tree);

      insertAll(tree, [10, 20, 30]);
      tree.balance();

      const checks = frames.filter((frame) => frame.action === 'balance-check');
      const rotationIndex = frames.findIndex(
        (frame) => frame.action === 'rotation',
      );

      expect(checks).toHaveLength(1);
      expect(rotationIndex).toBeGreaterThan(frames.indexOf(checks[0]));

      const unbalanced = everyNode(checks[0].root).filter(
        (node) => Math.abs(getBalanceFactor(node)) > 1,
      );
      expect(unbalanced.map((node) => node.id)).toEqual(['n-10']);
    });
  });

  test('fuzz: edits hold the ordering, balancing holds the avl invariant', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const random = makePrng(seed);
      const tree = new AVLTree();
      collectFrames(tree);

      const live: { id: string; value: number }[] = [];
      for (let step = 0; step < 50; step++) {
        // ids come off the step rather than the value, since values repeat
        const node = { id: `n-${step}`, value: Math.floor(random() * 120) };
        tree.insert(node);
        live.push(node);
      }

      expectValidBst(
        tree,
        live.map((node) => node.value),
      );

      for (const node of [...live].filter(() => random() < 0.5)) {
        tree.remove(node.id);
        live.splice(live.indexOf(node), 1);
      }

      expectValidBst(
        tree,
        live.map((node) => node.value),
      );

      // one bottom up pass only repairs a tree that was already an edit away
      // from balanced, so a tree built by hand takes a few
      let passes = 0;
      while (!isBalanced(tree.root) && passes < live.length) {
        tree.balance();
        passes++;
      }

      expectValidBst(
        tree,
        live.map((node) => node.value),
      );
      expect(isBalanced(tree.root)).toBe(true);
    }
  });
});
