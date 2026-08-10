import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { primsExplainer } from './explainer.ts';
import { PrimsFrame } from './frame.ts';

// TODO: update language

/*
  explainerSegments.ts throws if a [bracketed] term in `content` has no
  matching entry in `highlights` (matched positionally, left to right) - see
  packages/magic-shared/src/explainer/explainerSegments.ts. counting square
  brackets here is a cheap way to catch that mismatch without standing up the
  full graph/theme stack explainerSegments needs.
*/
const countBracketedTerms = (content: string) =>
  [...content.matchAll(/\[([^\]]*)\]/g)].length;

const edges: Record<string, { source: string; target: string; weight: Fraction }> = {
  e0: { source: 'a', target: 'b', weight: new Fraction(1) },
  e1: { source: 'b', target: 'c', weight: new Fraction(2) },
  e2: { source: 'a', target: 'c', weight: new Fraction(9) },
};

const graph = {
  getEdge: (id: string) => edges[id],
} as any;

const explain = primsExplainer(graph);

const baseState = {
  treeNodeIds: ['a', 'b'],
  treeEdgeIds: ['e0'],
  excludedEdgeIds: [],
  anchorNodeId: 'a',
};

describe('primsExplainer', () => {
  it('never leaves a [bracketed] term without a matching highlight', () => {
    const frames: PrimsFrame[] = [
      { ...baseState, type: 'start', start: 'a', activeNodeId: 'a' },
      { ...baseState, type: 'end' },
      {
        ...baseState,
        type: 'consider-edges',
        edges: ['e1', 'e2'],
      },
      { ...baseState, type: 'compare-edges', left: 'e1', right: 'e2' },
      {
        ...baseState,
        type: 'select-edge',
        edge: 'e1',
        node: 'c',
      },
      {
        ...baseState,
        type: 'select-edge',
        edge: 'e1',
        node: 'c',
        tiedEdges: ['e1', 'e2'],
      },
      { ...baseState, type: 'exclude-edges', edges: ['e2'] },
      { ...baseState, type: 'exclude-edges', edges: ['e1', 'e2'] },
      { ...baseState, type: 'unreachable', nodes: ['z'] },
    ];

    for (const frame of frames) {
      const explainer = explain(frame);
      expect(explainer, `frame type ${frame.type} produced no explainer`).toBeDefined();
      if (!explainer) continue;
      const content = explainer.content as string;
      const highlightCount = explainer.highlights?.length ?? 0;
      expect(
        highlightCount,
        `frame type ${frame.type}: "${content}"`,
      ).toBe(countBracketedTerms(content));
    }
  });

  it('names the excluded edge and explains why when one edge is ruled out', () => {
    const explainer = explain({
      ...baseState,
      type: 'exclude-edges',
      edges: ['e2'],
    });
    expect(explainer?.content).toContain('Loop');
    expect(explainer?.content).toContain('it would');
  });

  it('uses plural phrasing when more than one edge is ruled out at once', () => {
    const explainer = explain({
      ...baseState,
      type: 'exclude-edges',
      edges: ['e1', 'e2'],
    });
    expect(explainer?.content).toContain('they would');
  });
});
