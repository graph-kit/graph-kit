import { describe, expect, it } from 'vitest';

import { AVLTree } from '../tree/AVLTree.ts';
import { getNodeById } from '../tree/getNodeById.ts';
import { graphToTree } from './graphToTree.ts';
import { GraphState, ROOT_POSITION, treeToGraph } from './treeToGraph.ts';

/** the drawn graph, standing in for the one a decode hands back */
const makeGraph = (state: GraphState): any => {
  const findNode = (id: string) => state.nodes.find((node) => node.id === id);

  return {
    nodes: { value: state.nodes },
    edges: { value: state.edges },
    getNode: findNode,
    positions: { get: (id: string) => findNode(id)?.position },
  };
};

const drawAndRead = (tree: AVLTree) =>
  graphToTree(makeGraph(treeToGraph(tree.root, ROOT_POSITION)));

describe('tree to graph and back', () => {
  it('keeps every node of a tree that is nothing but duplicates', () => {
    const tree = new AVLTree();
    tree.attachFrameCollector({ add: () => {} });

    tree.insert({ id: 'a', value: 5 });
    tree.insert({ id: 'b', value: 5 });
    tree.insert({ id: 'c', value: 5 });
    // the rotation is what seats an equal value on either side of the root
    tree.balance();

    const adopted = drawAndRead(tree);

    expect(getNodeById(adopted, 'a')).toBeDefined();
    expect(getNodeById(adopted, 'b')).toBeDefined();
    expect(getNodeById(adopted, 'c')).toBeDefined();
  });

  it('removes the node that was asked for, not the first of its value', () => {
    const tree = new AVLTree();
    tree.attachFrameCollector({ add: () => {} });

    tree.insert({ id: 'a', value: 5 });
    tree.insert({ id: 'b', value: 5 });
    tree.insert({ id: 'c', value: 5 });
    tree.balance();

    const decoded = new AVLTree(drawAndRead(tree));
    decoded.remove('a');

    expect(getNodeById(decoded.root, 'a')).toBeUndefined();
    expect(getNodeById(decoded.root, 'b')).toBeDefined();
    expect(getNodeById(decoded.root, 'c')).toBeDefined();
  });
});
