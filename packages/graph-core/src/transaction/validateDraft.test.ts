import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GraphState } from './types.ts';
import { createInspectDraft, createValidateDraft } from './validateDraft.ts';

const graph = (state: { nodes?: CoreNode[]; edges?: CoreEdge[] } = {}) =>
  ({
    nodes: () => state.nodes ?? [],
    edges: () => state.edges ?? [],
  }) satisfies GraphState;

const nodeA: CoreNode = { id: 'node-a' };
const nodeB: CoreNode = { id: 'node-b' };

const edgeAtoB: CoreEdge = {
  id: 'edge-1',
  source: 'node-a',
  target: 'node-b',
};

describe(createInspectDraft, () => {
  it('keeps an edge whose endpoints are both live', () => {
    const inspect = createInspectDraft(graph({ nodes: [nodeA, nodeB] }), true);
    const inspection = inspect({ addEdges: [edgeAtoB] });

    expect(inspection.valid).toBe(true);
    expect(inspection.draft.addEdges).toEqual([edgeAtoB]);
  });

  it('drops an edge whose endpoint is not in the graph', () => {
    const orphan: CoreEdge = { id: 'edge-1', source: 'node-a', target: 'gone' };
    const inspect = createInspectDraft(graph({ nodes: [nodeA] }), true);
    const inspection = inspect({ addEdges: [orphan] });

    expect(inspection.valid).toBe(false);
    expect(inspection.draft.addEdges).toEqual([]);
    expect(inspection.rejections).toEqual([
      { id: 'edge-1', reason: expect.stringContaining('no node to connect') },
    ]);
  });

  it('keeps an edge whose endpoint arrives in the same draft', () => {
    const inspect = createInspectDraft(graph({ nodes: [nodeA] }), true);
    const inspection = inspect({ addNodes: [nodeB], addEdges: [edgeAtoB] });

    expect(inspection.valid).toBe(true);
    expect(inspection.draft.addNodes).toEqual([nodeB]);
    expect(inspection.draft.addEdges).toEqual([edgeAtoB]);
  });

  it('drops an edge whose endpoint the same draft removes', () => {
    const inspect = createInspectDraft(graph({ nodes: [nodeA, nodeB] }), true);
    const inspection = inspect({
      addEdges: [edgeAtoB],
      removeNodeIds: ['node-b'],
    });

    expect(inspection.draft.addEdges).toEqual([]);
  });

  it('drops an element whose id is already taken', () => {
    const inspect = createInspectDraft(
      graph({ nodes: [nodeA, nodeB], edges: [edgeAtoB] }),
      true,
    );
    const inspection = inspect({
      addNodes: [nodeA],
      addEdges: [edgeAtoB],
    });

    expect(inspection.draft.addNodes).toEqual([]);
    expect(inspection.draft.addEdges).toEqual([]);
  });

  it('drops a duplicate carried within one draft', () => {
    const inspect = createInspectDraft(graph(), true);

    expect(inspect({ addNodes: [nodeA, nodeA] }).draft.addNodes).toEqual([
      nodeA,
    ]);
  });

  it('judges an element that has no id yet', () => {
    const inspect = createInspectDraft(graph({ nodes: [nodeA, nodeB] }), true);

    expect(
      inspect({ addEdges: [{ source: 'node-a', target: 'node-b' }] }).valid,
    ).toBe(true);
    expect(
      inspect({ addEdges: [{ source: 'node-a', target: 'gone' }] }).valid,
    ).toBe(false);
  });

  describe('one edge per path', () => {
    const connected = graph({ nodes: [nodeA, nodeB], edges: [edgeAtoB] });

    it('drops a second edge along the same direction', () => {
      const inspect = createInspectDraft(connected, true);
      const parallel: CoreEdge = {
        id: 'parallel',
        source: 'node-a',
        target: 'node-b',
      };

      expect(inspect({ addEdges: [parallel] }).draft.addEdges).toEqual([]);
    });

    it('keeps the opposite direction when directed', () => {
      const inspect = createInspectDraft(connected, true);
      const opposite: CoreEdge = {
        id: 'opposite',
        source: 'node-b',
        target: 'node-a',
      };

      expect(inspect({ addEdges: [opposite] }).draft.addEdges).toEqual([
        opposite,
      ]);
    });

    it('drops the opposite direction when undirected', () => {
      const inspect = createInspectDraft(connected, false);
      const opposite: CoreEdge = {
        id: 'opposite',
        source: 'node-b',
        target: 'node-a',
      };

      expect(inspect({ addEdges: [opposite] }).draft.addEdges).toEqual([]);
    });

    it('drops a duplicate path carried within one draft', () => {
      const inspect = createInspectDraft(
        graph({ nodes: [nodeA, nodeB] }),
        true,
      );
      const first: CoreEdge = {
        id: 'first',
        source: 'node-a',
        target: 'node-b',
      };
      const second: CoreEdge = {
        id: 'second',
        source: 'node-a',
        target: 'node-b',
      };

      expect(inspect({ addEdges: [first, second] }).draft.addEdges).toEqual([
        first,
      ]);
    });

    it('frees the path when the same draft removes the edge holding it', () => {
      const inspect = createInspectDraft(connected, true);
      const replacement: CoreEdge = {
        id: 'replacement',
        source: 'node-a',
        target: 'node-b',
      };

      const inspection = inspect({
        addEdges: [replacement],
        removeEdgeIds: [edgeAtoB.id],
      });

      expect(inspection.draft.addEdges).toEqual([replacement]);
    });
  });

  it('says nothing about a draft that adds nothing', () => {
    const inspect = createInspectDraft(graph({ nodes: [nodeA] }), true);

    expect(inspect({ removeNodeIds: ['node-a'] }).valid).toBe(true);
  });
});

describe(createValidateDraft, () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const orphan: CoreEdge = { id: 'edge-1', source: 'node-a', target: 'gone' };

  it('hands back only what survives', () => {
    const validate = createValidateDraft(
      createInspectDraft(graph({ nodes: [nodeA] }), true),
    );

    expect(validate({ addEdges: [orphan] }).addEdges).toEqual([]);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('complains about the same element only once', () => {
    const validate = createValidateDraft(
      createInspectDraft(graph({ nodes: [nodeA] }), true),
    );

    validate({ addEdges: [orphan] });
    validate({ addEdges: [orphan] });
    validate({ addEdges: [orphan] });

    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('leaves a draft it accepts whole untouched', () => {
    const validate = createValidateDraft(
      createInspectDraft(graph({ nodes: [nodeA, nodeB] }), true),
    );
    const draft = { addEdges: [edgeAtoB] };

    expect(validate(draft)).toBe(draft);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
