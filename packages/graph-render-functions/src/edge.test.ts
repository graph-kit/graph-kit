import { AnimatedShapeFactories } from '@canvas/primitives/animation/index';
import { Shape } from '@canvas/primitives/types/index';
import { Coordinate } from '@canvas/primitives/types/utility';
import { ComputedTokenResolver } from '@graph/computed-tokens/index';
import { CoreEdge } from '@graph/primitives/types';
import { describe, expect, it } from 'vitest';

import { createEdgeRenderFunction } from './edge.ts';
import { EdgeRenderOptions } from './types.ts';

// deliberately off both axes, so a sign error cannot pass by landing on a symmetric route
const NODE_POSITIONS: Record<string, Coordinate> = {
  a: { x: 100, y: 100 },
  b: { x: 400, y: 260 },
};

const EDGE_WIDTH = 8;
const SPACING = 20;

/** distance between the centers of two neighboring edges in a fan */
const SLOT_PITCH = EDGE_WIDTH + SPACING;

const TOKEN_VALUES = {
  'edge.width': EDGE_WIDTH,
  'edge.color': 'black',
  'edge.cursor': 'default',
  'edge.text.content': '',
  'edge.text.size': 12,
  'edge.text.color': 'black',
  'edge.text.fontWeight': 'normal',
  'edge.text.fontFamily': 'Arial',
  'node.size': 30,
  'node.color': 'black',
  'node.border.width': 2,
  'node.border.color': 'black',
  'node.cursor': 'default',
  'node.text.content': '',
  'node.text.size': 12,
  'node.text.color': 'black',
  'node.text.fontWeight': 'normal',
  'node.text.fontFamily': 'Arial',
} as const;

const resolveToken = ((token: keyof typeof TOKEN_VALUES) =>
  TOKEN_VALUES[token]) as ComputedTokenResolver;

const edge = (id: string, source: string, target: string): CoreEdge => ({
  id,
  source,
  target,
});

type Segment = { start: Coordinate; end: Coordinate };

/**
 * renders every edge in a fan and hands back the segment each one was drawn as, keyed by id.
 * every edge in a fan shares a path, so `parallelEdges` answering with the whole fan matches
 * what `getEdgesBetweenConnectedNodes` would return for any member of it.
 */
const renderFan = (
  fan: readonly CoreEdge[],
  options: Partial<EdgeRenderOptions> = {},
) => {
  const segments = new Map<string, Segment>();

  const capture = (schema: { id: string } & Segment) => {
    segments.set(schema.id, { start: schema.start, end: schema.end });
    return {} as Shape;
  };

  const render = createEdgeRenderFunction({
    shapes: {
      line: capture,
      arrow: capture,
    } as unknown as AnimatedShapeFactories,
    resolveToken,
    directed: false,
    labelTextInputColor: () => 'black',
    parallelEdges: () => fan,
    neighborPositions: () => [],
    layout: { parallelEdgeSpacing: SPACING, labelled: false },
    ...options,
  });

  for (const member of fan) {
    render({
      id: member.id,
      source: { id: member.source, position: NODE_POSITIONS[member.source]! },
      target: { id: member.target, position: NODE_POSITIONS[member.target]! },
    });
  }

  return segments;
};

const ROUTE_ANGLE = Math.atan2(
  NODE_POSITIONS.b!.y - NODE_POSITIONS.a!.y,
  NODE_POSITIONS.b!.x - NODE_POSITIONS.a!.x,
);

/** unit vector square to the a to b route, the axis a fan spreads along */
const ROUTE_NORMAL = {
  x: Math.cos(ROUTE_ANGLE + Math.PI / 2),
  y: Math.sin(ROUTE_ANGLE + Math.PI / 2),
};

const ROUTE_MIDPOINT = {
  x: (NODE_POSITIONS.a!.x + NODE_POSITIONS.b!.x) / 2,
  y: (NODE_POSITIONS.a!.y + NODE_POSITIONS.b!.y) / 2,
};

/** trig leaves float noise that exact equality cannot survive, down to a -0 that Object.is reads as its own value */
const round = (value: number) => {
  const rounded = Math.round(value * 1e6) / 1e6;
  return rounded === 0 ? 0 : rounded;
};

/**
 * how far off the straight route an edge was drawn, signed so the two sides of the route
 * report opposite values. measured at the midpoint, which keeps the answer the same whichever
 * way the edge runs and whether or not its end was shortened to make room for an arrow head.
 */
const offsetFromRoute = ({ start, end }: Segment) => {
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  return round(
    (midpoint.x - ROUTE_MIDPOINT.x) * ROUTE_NORMAL.x +
      (midpoint.y - ROUTE_MIDPOINT.y) * ROUTE_NORMAL.y,
  );
};

/** zero when the drawn segment is parallel to the straight route */
const driftFromRoute = ({ start, end }: Segment) =>
  round(
    (end.x - start.x) * ROUTE_NORMAL.x + (end.y - start.y) * ROUTE_NORMAL.y,
  );

const offsetsOf = (segments: Map<string, Segment>) =>
  [...segments].map(([id, segment]) => [id, offsetFromRoute(segment)] as const);

describe('createEdgeRenderFunction parallel edge geometry', () => {
  it('runs an edge that has the path to itself straight down the route', () => {
    const segments = renderFan([edge('1', 'a', 'b')]);
    expect(offsetsOf(segments)).toEqual([['1', 0]]);
  });

  it('splits a pair sharing a direction onto opposite sides of the route', () => {
    const segments = renderFan([edge('1', 'a', 'b'), edge('2', 'a', 'b')]);
    expect(offsetsOf(segments)).toEqual([
      ['1', -SLOT_PITCH / 2],
      ['2', SLOT_PITCH / 2],
    ]);
  });

  it('splits a pair running in opposite directions onto opposite sides of the route', () => {
    // a reversed edge draws along a flipped perpendicular, so without the sign flip in the
    // renderer both of these resolve to the same offset and the fan collapses to one line
    const segments = renderFan([edge('1', 'a', 'b'), edge('2', 'b', 'a')]);
    const [forward, backward] = offsetsOf(segments);

    expect(forward![1]).toBe(-SLOT_PITCH / 2);
    expect(backward![1]).toBe(SLOT_PITCH / 2);
  });

  it('centers a trio on the route, leaving the middle edge on it', () => {
    const segments = renderFan([
      edge('1', 'a', 'b'),
      edge('2', 'a', 'b'),
      edge('3', 'b', 'a'),
    ]);

    expect(offsetsOf(segments)).toEqual([
      ['1', -SLOT_PITCH],
      ['2', 0],
      ['3', SLOT_PITCH],
    ]);
  });

  it('centers a fan of four on the route, leaving no edge on it', () => {
    const segments = renderFan([
      edge('1', 'a', 'b'),
      edge('2', 'b', 'a'),
      edge('3', 'a', 'b'),
      edge('4', 'b', 'a'),
    ]);

    // edges sharing a direction take neighboring slots, so the fan reads as two groups
    expect(offsetsOf(segments)).toEqual([
      ['1', -SLOT_PITCH * 1.5],
      ['2', SLOT_PITCH * 0.5],
      ['3', -SLOT_PITCH * 0.5],
      ['4', SLOT_PITCH * 1.5],
    ]);
  });

  it('shifts both ends of an edge equally, so a fan stays parallel to the route', () => {
    const segments = renderFan([
      edge('1', 'a', 'b'),
      edge('2', 'a', 'b'),
      edge('3', 'b', 'a'),
    ]);

    for (const [, segment] of segments) {
      expect(driftFromRoute(segment)).toBe(0);
    }
  });

  it('leaves parallelEdgeSpacing of whitespace between neighbors in a fan', () => {
    const segments = renderFan([
      edge('1', 'a', 'b'),
      edge('2', 'a', 'b'),
      edge('3', 'b', 'a'),
    ]);

    const offsets = offsetsOf(segments)
      .map(([, offset]) => offset)
      .toSorted((previous, next) => previous - next);

    // an edge paints EDGE_WIDTH across its offset, so the gap is what is left between the edges of the strokes
    const gaps = offsets
      .slice(1)
      .map((offset, index) => offset - offsets[index]! - EDGE_WIDTH);

    expect(gaps).toEqual([SPACING, SPACING]);
  });

  it('draws a fan touching with no whitespace when spacing is zero', () => {
    const segments = renderFan([edge('1', 'a', 'b'), edge('2', 'b', 'a')], {
      layout: { parallelEdgeSpacing: 0 },
    });

    const [first, second] = offsetsOf(segments).map(([, offset]) => offset);
    expect(second! - first!).toBe(EDGE_WIDTH);
  });

  const DEFAULT_SPACING = 12;

  it('falls back to a default spacing when no layout is supplied', () => {
    const segments = renderFan([edge('1', 'a', 'b'), edge('2', 'a', 'b')], {
      layout: undefined,
    });

    const [first, second] = offsetsOf(segments).map(([, offset]) => offset);
    expect(second! - first!).toBe(EDGE_WIDTH + DEFAULT_SPACING);
  });

  it('falls back to a default spacing when layout omits it', () => {
    const segments = renderFan([edge('1', 'a', 'b'), edge('2', 'a', 'b')], {
      layout: {},
    });

    const [first, second] = offsetsOf(segments).map(([, offset]) => offset);
    expect(second! - first!).toBe(EDGE_WIDTH + DEFAULT_SPACING);
  });

  it('fans directed edges the same as undirected ones', () => {
    const fan = [edge('1', 'a', 'b'), edge('2', 'b', 'a')];

    expect(offsetsOf(renderFan(fan, { directed: true }))).toEqual(
      offsetsOf(renderFan(fan)),
    );
  });

  it('draws an edge in the same place no matter what order the fan arrives in', () => {
    const fan = [edge('2', 'b', 'a'), edge('3', 'a', 'b'), edge('1', 'a', 'b')];

    const segments = renderFan(fan);
    const reversed = renderFan([...fan].reverse());

    for (const { id } of fan) {
      expect(offsetFromRoute(reversed.get(id)!)).toBe(
        offsetFromRoute(segments.get(id)!),
      );
    }
  });

  // tracked by #826, self directed edges take a slot but draw on top of each other
  it.todo('fans self directed edges sharing a node');
});
