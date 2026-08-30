import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { bellmanFord } from './bellman-ford.ts';
import { dijkstras } from './dijkstras.ts';
import { singleSourceExplainer } from './explainer.ts';
import { SingleSourceFrame, SingleSourceFunction } from './frame.ts';

/** source, target, weight. the weight is anything `new Fraction()` takes */
type EdgeSpec = [string, string, number | string];

/*
  the explainer reads more off a graph than the algorithms do: it looks up
  labels and weights, and builds themers for the paths it points at. none of
  that needs a canvas, so the themer is stood up as a recorder of which edges it
  would paint, which is the half of it worth asserting on
*/
const makeGraph = (nodeIds: string[], edgeSpecs: EdgeSpec[]) => {
  const edges = edgeSpecs.map(([source, target, weight], index) => ({
    id: `e${index}`,
    source,
    target,
    weight: new Fraction(weight),
  }));

  return {
    nodes: { value: nodeIds.map((id) => ({ id })) },
    edges: { value: edges },
    getNode: (id: string) => ({ id, label: id.toUpperCase() }),
    getEdge: (id: string) => edges.find((edge) => edge.id === id),
    theme: {
      createThemer: () => ({
        activate: () => {},
        deactivate: () => {},
        isActive: () => false,
      }),
    },
    focus: { theme: { _resolveToken: () => '#ffffff' } },
  } as any;
};

const collect = (graph: any, algorithm: SingleSourceFunction) => {
  const frames: SingleSourceFrame[] = [];
  algorithm(graph, 'a')({ add: (frame) => frames.push(frame) });
  return frames;
};

// a -1-> b -2-> c, a -4-> c, c -1/3-> d, b -6-> d. every relaxation outcome
// shows up in it: a first arrival, an improvement over an existing route, an
// offer that is refused, and a fraction that needs approximating
const MIXED: EdgeSpec[] = [
  ['a', 'b', 1],
  ['a', 'c', 4],
  ['b', 'c', 2],
  ['b', 'd', 6],
  ['c', 'd', '1/3'],
];

const bracketedSegments = (content: string) =>
  [...content.matchAll(/\[([^\]]*)\]/g)].map((match) => match[1]);

describe('single source explainer', () => {
  /*
    highlights are handed to [bracketed] segments by position, so a highlight
    with no segment to land on does not fail, it silently shifts every highlight
    after it onto the wrong words. a sentence edited without its highlight list
    is exactly how that happens, so the count is asserted rather than trusted
  */
  const algorithms = { dijkstras, bellmanFord };

  for (const [name, algorithm] of Object.entries(algorithms)) {
    it(`gives ${name} one highlight per bracketed segment`, () => {
      const graph = makeGraph(['a', 'b', 'c', 'd'], MIXED);
      const explainer = singleSourceExplainer(graph);
      const frames = collect(graph, algorithm);

      expect(frames.length).toBeGreaterThan(0);

      for (const frame of frames) {
        const explained = explainer(frame);
        if (!explained) continue;

        const content = explained.content as string;
        const highlights = explained.highlights ?? [];

        expect({
          type: frame.type,
          segments: bracketedSegments(content),
          highlights: (highlights as unknown[]).length,
        }).toEqual({
          type: frame.type,
          segments: bracketedSegments(content),
          highlights: bracketedSegments(content).length,
        });
      }
    });
  }
});
