import { TransactionPayload } from '@graph/primitives/transactions/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { describe, expect, it, vi } from 'vitest';

import { createCommitTransaction } from './createCommitTransaction.ts';
import { createEmptyPayload } from './createEmptyPayload.ts';
import { TransactionOptions } from './types.ts';
import { createInspectDraft } from './validateDraft.ts';

const options = (
  state: {
    nodes?: CoreNode[];
    edges?: CoreEdge[];
    directed?: boolean;
    success?: () => void;
  } = {},
): TransactionOptions => {
  const graph = {
    nodes: () => state.nodes ?? [],
    edges: () => state.edges ?? [],
  };

  return {
    graph,
    inspectDraft: createInspectDraft(graph, state.directed ?? true),
    onTransactionSucceeded: state.success ?? (() => {}),
  };
};

describe(createCommitTransaction, () => {
  it('handles adding a node', () => {
    const newNode: CoreNode = { id: 'new-node' };
    const commitTransaction = createCommitTransaction(options());
    const expectedPayload: TransactionPayload = {
      ...createEmptyPayload(),
      addedNodes: [newNode],
    };
    const payload = commitTransaction({ addNodes: [newNode] });
    expect(payload).toEqual(expectedPayload);
  });

  it('scrapes and removes orphaned edges automatically when a node is removed', () => {
    const node1: CoreNode = { id: 'node-1' };
    const node2: CoreNode = { id: 'node-2' };
    const connectedEdge: CoreEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    };

    const commitTransaction = createCommitTransaction(
      options({
        nodes: [node1, node2],
        edges: [connectedEdge],
      }),
    );

    const expectedPayload: TransactionPayload = {
      ...createEmptyPayload(),
      removedNodeIds: [node1.id],
      // the engine should implicitly catch that edge-1 is now an orphan
      removedEdgeIds: [connectedEdge.id],
    };

    const payload = commitTransaction({ removeNodeIds: ['node-1'] });
    expect(payload).toEqual(expectedPayload);
  });

  it('refuses an added edge whose endpoint is not in the graph', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const node: CoreNode = { id: 'node-1' };
    const orphan: CoreEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'deleted-by-a-peer',
    };

    const commitTransaction = createCommitTransaction(
      options({ nodes: [node] }),
    );

    const payload = commitTransaction({ addEdges: [orphan] });
    expect(payload).toEqual(createEmptyPayload());
  });

  it('fires the onTransactionSuccess callback with the correct payload', () => {
    const newNode: CoreNode = { id: 'node-z' };

    const successSpy = vi.fn();

    const commitTransaction = createCommitTransaction(
      options({ success: successSpy }),
    );

    const payload = commitTransaction({ addNodes: [newNode] });
    expect(successSpy).toHaveBeenCalledExactlyOnceWith(payload);
  });
});
