import { getValue } from '@core/utils/maybeGetter/index';
import Fraction from 'fraction.js';
import { describe, expect, test, vi } from 'vitest';

import { GEdge, GNode, Graph } from '../graph/types.ts';
import { Explainer, ExplainerHighlight } from './types.ts';

vi.mock('../theme/node/index.ts', () => ({
  useNodeStyles: () => ({
    styles: { value: { border: { color: undefined } } },
    dispose: vi.fn(),
  }),
}));

vi.mock('../theme/edge/index.ts', () => ({
  useEdgeStyles: () => ({
    styles: { value: { color: undefined } },
    dispose: vi.fn(),
  }),
}));

const { explainerSegments } = await import('./explainerSegments.ts');

const graph = {
  isNode: (id: string): boolean => id.startsWith('node-'),
  isEdge: (id: string): boolean => id.startsWith('edge-'),
  getEdge: (id: string) =>
    ({ id, source: 'node-a', target: 'node-b' }) as GEdge,
  getNode: (id: string) => ({ id, label: `Label ${id}` }) as GNode,
  // undirected, so an edge label sorts its endpoints before joining them
  metadata: { directed: false },
  theme: {
    createThemer: () => ({
      activate: vi.fn(),
      deactivate: vi.fn(),
    }),
  },
  focus: {
    theme: {
      _resolveToken: () => undefined,
    },
  },
} as unknown as Graph;

// the shell half is unused by these cases: they exercise graph element resolution
const context = { graph, shell: {} } as unknown as Parameters<
  typeof explainerSegments
>[0];

const highlight = (
  overrides: Partial<ExplainerHighlight> = {},
): ExplainerHighlight => ({
  activate: vi.fn(),
  deactivate: vi.fn(),
  ...overrides,
});

describe(explainerSegments, () => {
  test('returns an empty array when explainer is undefined', () => {
    expect(explainerSegments(context, undefined)).toEqual([]);
  });

  test('returns a single unhighlighted segment when there are no brackets', () => {
    const explainer: Explainer = {
      content: 'no brackets here',
      highlights: [],
    };

    expect(explainerSegments(context, explainer)).toEqual([
      {
        id: expect.any(String),
        text: 'no brackets here',
        highlight: undefined,
      },
    ]);
  });

  test('splits leading, highlighted, and trailing text', () => {
    const h = highlight();
    const explainer: Explainer = {
      content: 'Looking at [Node A] now',
      highlights: [h],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'Looking at ',
      'Node A',
      ' now',
    ]);
    expect(segments[0].highlight).toBeUndefined();
    expect(segments[1].highlight).toBe(h);
    expect(segments[2].highlight).toBeUndefined();
  });

  test('handles multiple bracketed segments in order', () => {
    const h1 = highlight();
    const h2 = highlight();
    const explainer: Explainer = {
      content: '[Looking] [at] Node A',
      highlights: [h1, h2],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'Looking',
      ' ',
      'at',
      ' Node A',
    ]);
    expect(segments[0].highlight).toBe(h1);
    expect(segments[1].highlight).toBeUndefined();
    expect(segments[2].highlight).toBe(h2);
    expect(segments[3].highlight).toBeUndefined();
  });

  test('handles content that starts and ends with brackets', () => {
    const h1 = highlight();
    const h2 = highlight();
    const explainer: Explainer = {
      content: '[Start] middle [End]',
      highlights: [h1, h2],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'Start',
      ' middle ',
      'End',
    ]);
    expect(segments[0].highlight).toBe(h1);
    expect(segments[1].highlight).toBeUndefined();
    expect(segments[2].highlight).toBe(h2);
  });

  test('handles adjacent bracketed segments with no text between them', () => {
    const h1 = highlight();
    const h2 = highlight();
    const explainer: Explainer = {
      content: '[Foo][Bar]',
      highlights: [h1, h2],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual(['Foo', 'Bar']);
    expect(segments[0].highlight).toBe(h1);
    expect(segments[1].highlight).toBe(h2);
  });

  test('throws when there are more bracketed segments than highlights', () => {
    const explainer: Explainer = {
      content: '[Foo] and [Bar]',
      highlights: [highlight()],
    };

    expect(() => explainerSegments(context, explainer)).toThrow();
  });

  test('resolves content when it is a getter function', () => {
    const explainer: Explainer = {
      content: () => 'no brackets here',
      highlights: [],
    };

    expect(explainerSegments(context, explainer)).toEqual([
      {
        id: expect.any(String),
        text: 'no brackets here',
        highlight: undefined,
      },
    ]);
  });

  test('resolves highlights when it is a getter function', () => {
    const h = highlight();
    const explainer: Explainer = {
      content: 'Looking at [Node A] now',
      highlights: () => [h],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'Looking at ',
      'Node A',
      ' now',
    ]);
    expect(segments[1].highlight).toBe(h);
  });

  test('resolves both content and highlights when both are getter functions', () => {
    const h = highlight();
    const explainer: Explainer = {
      content: () => 'Looking at [Node A] now',
      highlights: () => [h],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'Looking at ',
      'Node A',
      ' now',
    ]);
    expect(segments[1].highlight).toBe(h);
  });

  test('resolves a curly-braced node id to its label and auto-highlights it', () => {
    const explainer: Explainer = {
      content: 'This is Node {node-a} and here is a [highlight]',
      highlights: [highlight()],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'This is Node ',
      'Label node-a',
      ' and here is a ',
      'highlight',
    ]);
    expect(segments[1].highlight).toBeDefined();
    expect(segments[3].highlight).toBeDefined();
  });

  test('handles multiple curly-braced node ids without consuming bracket highlights', () => {
    const h = highlight();
    const explainer: Explainer = {
      content: 'Comparing {node-a} to {node-b} for [Reason]',
      highlights: [h],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((s) => getValue(s.text))).toEqual([
      'Comparing ',
      'Label node-a',
      ' to ',
      'Label node-b',
      ' for ',
      'Reason',
    ]);
    expect(segments.at(-1)?.highlight).toBe(h);
  });

  test('resolves a curly-braced edge id to its label and auto-highlights it', () => {
    const explainer: Explainer = {
      content: 'Take edge {edge-a} next',
      highlights: [],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'Take edge ',
      'Label node-aLabel node-b',
      ' next',
    ]);
    expect(segments[1].highlight).toBeDefined();
  });

  test('resolves node and edge ids in the same content', () => {
    const explainer: Explainer = {
      content: 'From {node-a} along {edge-a}',
      highlights: [],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'From ',
      'Label node-a',
      ' along ',
      'Label node-aLabel node-b',
    ]);
    expect(segments[1].highlight).toBeDefined();
    expect(segments[3].highlight).toBeDefined();
  });

  test('marks a curly-braced id that is neither node nor edge as not in graph', () => {
    const explainer: Explainer = {
      content: 'Missing {ghost-a}',
      highlights: [],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'Missing ',
      '?',
    ]);
    expect(segments[1].highlight?.tooltipLabel).toBe(
      'Graph Element With ID ghost-a Not In Graph',
    );
  });

  test('resolves an angled fraction to a hoverable decimal', () => {
    const explainer: Explainer = {
      content: 'The cost is <5/2>',
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'The cost is ',
      '5/2',
    ]);
    expect(segments[1].highlight?.tooltipLabel).toBe('2.5');
  });

  test('resolves an angled decimal to the same fraction and hint', () => {
    const segments = explainerSegments(context, { content: 'This is <3.5>' });

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'This is ',
      '7/2',
    ]);
    expect(segments[1].highlight?.tooltipLabel).toBe('3.5');
  });

  test('resolves an angled repeating decimal, as a stringified Fraction gives', () => {
    const segments = explainerSegments(context, {
      content: `This is <${new Fraction(1, 3)}>`,
    });

    expect(getValue(segments[1].text)).toBe('1/3');
    expect(segments[1].highlight?.tooltipLabel).toBe('~0.333');
  });

  test('rounds a repeating fraction and marks it as approximate', () => {
    const segments = explainerSegments(context, { content: '<1/3>' });

    expect(segments[0].highlight?.tooltipLabel).toBe('~0.333');
  });

  test('leaves an angled fraction that is an integer unhighlighted', () => {
    const segments = explainerSegments(context, { content: 'costs <4/2>' });

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'costs ',
      '2',
    ]);
    expect(segments[1].highlight).toBeUndefined();
  });

  test('resolves an angled infinity, written either way', () => {
    const segments = explainerSegments(context, {
      content: `<∞> and <${Infinity}>`,
    });

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      '∞',
      ' and ',
      '∞',
    ]);
    expect(segments[0].highlight).toBeUndefined();
    expect(segments[2].highlight).toBeUndefined();
  });

  test('angled fractions do not consume bracket highlights', () => {
    const h = highlight();
    const explainer: Explainer = {
      content: '<1/3> and <2/3> for [Reason]',
      highlights: [h],
    };

    const segments = explainerSegments(context, explainer);

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      '1/3',
      ' and ',
      '2/3',
      ' for ',
      'Reason',
    ]);
    expect(segments.at(-1)?.highlight).toBe(h);
  });

  test('marks an angled number it cannot read with a hoverable reason', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const segments = explainerSegments(context, { content: 'costs <half>' });

    expect(segments.map((segment) => getValue(segment.text))).toEqual([
      'costs ',
      '?',
    ]);
    expect(segments[1].highlight?.tooltipLabel).toBe(
      'Cannot Parse half As A Number',
    );
    expect(consoleError).toHaveBeenCalledWith(
      'explainer: cannot parse "half" as a number',
    );

    consoleError.mockRestore();
  });

  test('defaults to an empty array when highlights is undefined', () => {
    const explainer: Explainer = {
      content: 'no brackets here',
    };

    expect(explainerSegments(context, explainer)).toEqual([
      {
        id: expect.any(String),
        text: 'no brackets here',
        highlight: undefined,
      },
    ]);
  });
});
