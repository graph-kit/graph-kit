import fc from 'fast-check';
import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { kruskals } from '../kruskals/index.ts';
import { graphArbitrary } from '../testing/graphGenerator.ts';
import type { Edge, Node } from '../types.ts';
import { getAllMsts } from './index.ts';

const normalize = (mst: Edge[]) => mst.map((e) => e.id).sort();

const normalizeAll = (msts: Edge[][]) => msts.map(normalize).sort();

describe(getAllMsts, () => {
  it('returns every MST of a triangle with equal weights', () => {
    const nodes: Node[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(1) },
    ];

    const result = getAllMsts(nodes, edges);

    expect(result.msts).toHaveLength(3);

    expect(normalizeAll(result.msts)).toEqual([
      ['AB', 'AC'],
      ['AB', 'BC'],
      ['AC', 'BC'],
    ]);
  });

  it('single unique-weight MST matches kruskals result', () => {
    const nodes: Node[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(4) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(2) },
      { id: 'BD', source: 'B', target: 'D', weight: new Fraction(5) },
      { id: 'CD', source: 'C', target: 'D', weight: new Fraction(3) },
    ];

    const result = getAllMsts(nodes, edges);
    console.log(
      result.msts.map((mst) => mst.map((e) => e.id)),
      result.totalWeight.toFraction(),
    );

    expect(result.msts).toHaveLength(1);
    expect(result.msts[0].map((e) => e.id).sort()).toEqual(['AB', 'BC', 'CD']);
    expect(result.totalWeight.equals(new Fraction(6))).toBe(true);
  });

  it('K4 with two tied cheap edges among costlier unique ones', () => {
    // Square A-B-C-D-A, with two diagonal ties.
    const nodes: Node[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(1) },
      { id: 'CD', source: 'C', target: 'D', weight: new Fraction(1) },
      { id: 'DA', source: 'D', target: 'A', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(5) },
      { id: 'BD', source: 'B', target: 'D', weight: new Fraction(5) },
    ];

    const result = getAllMsts(nodes, edges);
    const sets = result.msts.map((mst) =>
      mst
        .map((e) => e.id)
        .sort()
        .join(','),
    );
    console.log(sets);

    // Any 3 of the 4 cycle edges forms a spanning tree; all 4 combos of "drop one edge" are valid, count = 4
    expect(result.msts).toHaveLength(4);
    expect(new Set(sets).size).toBe(4);
    expect(result.totalWeight.equals(new Fraction(3))).toBe(true);
  });

  it('disconnected graph produces a forest, per-component tie combinations', () => {
    const nodes: Node[] = [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' },
      { id: 'E' },
    ];
    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(1) },
      { id: 'DE', source: 'D', target: 'E', weight: new Fraction(2) },
    ];

    const result = getAllMsts(nodes, edges);
    console.log(
      result.msts.map((mst) => mst.map((e) => e.id)),
      result.connected,
    );

    expect(result.connected).toBe(false);
    expect(result.msts).toHaveLength(3);
    result.msts.forEach((mst) => expect(mst).toHaveLength(3));
  });

  it('returns a single MST when the minimum spanning tree is unique', () => {
    const nodes: Node[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];

    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(4) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(2) },
      { id: 'BD', source: 'B', target: 'D', weight: new Fraction(5) },
      { id: 'CD', source: 'C', target: 'D', weight: new Fraction(3) },
    ];

    const result = getAllMsts(nodes, edges);

    expect(result.connected).toBe(true);
    expect(result.totalWeight.equals(new Fraction(6))).toBe(true);

    expect(normalizeAll(result.msts)).toEqual([['AB', 'BC', 'CD']]);
  });
  it('does not include heavier edges when lighter spanning trees exist', () => {
    const nodes: Node[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(10) },
    ];

    const result = getAllMsts(nodes, edges);

    expect(result.msts).toHaveLength(1);

    expect(normalize(result.msts[0])).toEqual(['AB', 'BC']);
  });
  it('ignores self loops', () => {
    const nodes: Node[] = [{ id: 'A' }, { id: 'B' }];

    const edges: Edge[] = [
      { id: 'AA', source: 'A', target: 'A', weight: new Fraction(0) },
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
    ];

    const result = getAllMsts(nodes, edges);

    expect(result.connected).toBe(true);
    expect(normalize(result.msts[0])).toEqual(['AB']);
  });
  it('treats a graph with no nodes as connected', () => {
    const result = getAllMsts([], []);

    expect(result.connected).toBe(true);
    expect(result.msts).toEqual([[]]);
    expect(result.totalWeight.equals(new Fraction(0))).toBe(true);
  });
  it('treats a lone node as connected', () => {
    const result = getAllMsts([{ id: 'A' }], []);

    expect(result.connected).toBe(true);
    expect(result.msts).toEqual([[]]);
  });
  it('takes the Cartesian product of independent equal-weight choice points', () => {
    /*
      A
     / \
    B---C---D
           / \
          E---F
    */
    const nodes: Node[] = [
      { id: 'A' },
      { id: 'B' },
      { id: 'C' },
      { id: 'D' },
      { id: 'E' },
      { id: 'F' },
    ];

    const edges: Edge[] = [
      { id: 'AB', source: 'A', target: 'B', weight: new Fraction(1) },
      { id: 'BC', source: 'B', target: 'C', weight: new Fraction(1) },
      { id: 'AC', source: 'A', target: 'C', weight: new Fraction(1) },

      { id: 'DE', source: 'D', target: 'E', weight: new Fraction(1) },
      { id: 'EF', source: 'E', target: 'F', weight: new Fraction(1) },
      { id: 'DF', source: 'D', target: 'F', weight: new Fraction(1) },

      { id: 'CD', source: 'C', target: 'D', weight: new Fraction(0) },
    ];

    const result = getAllMsts(nodes, edges);

    expect(result.connected).toBe(true);
    expect(result.msts).toHaveLength(9);

    // Every MST should contain the mandatory bridge.
    expect(result.msts.every((mst) => mst.some((e) => e.id === 'CD'))).toBe(
      true,
    );
  });
});

describe('property based tests', () => {
  it('every returned MST is acyclic', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const result = getAllMsts(nodes, edges);

        for (const mst of result.msts) {
          const parent = new Map(nodes.map((n) => [n.id, n.id]));

          const find = (x: string): string => {
            const p = parent.get(x)!;
            if (p !== x) parent.set(x, find(p));
            return parent.get(x)!;
          };

          const union = (a: string, b: string) => {
            const rootA = find(a);
            const rootB = find(b);

            expect(rootA).not.toBe(rootB);

            parent.set(rootA, rootB);
          };

          mst.forEach((edge) => union(edge.source, edge.target));
        }
      }),
      { numRuns: 10 },
    );
  });
  it('all MSTs have identical weight', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const result = getAllMsts(nodes, edges);

        const weights = result.msts.map((mst) =>
          mst.reduce((sum, e) => sum.add(e.weight), new Fraction(0)),
        );

        weights.forEach((weight) => {
          expect(weight.equals(weights[0])).toBe(true);
        });
      }),
      { numRuns: 10 },
    );
  });
  it('never invents edges', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const result = getAllMsts(nodes, edges);

        const ids = new Set(edges.map((e) => e.id));

        result.msts.forEach((mst) =>
          mst.forEach((edge) => expect(ids.has(edge.id)).toBe(true)),
        );
      }),
      { numRuns: 10 },
    );
  });
  it('does not return duplicate MSTs', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const result = getAllMsts(nodes, edges);

        const seen = new Set(
          result.msts.map((mst) =>
            mst
              .map((e) => e.id)
              .sort()
              .join(','),
          ),
        );

        expect(seen.size).toBe(result.msts.length);
      }),
      { numRuns: 10 },
    );
  });
  it('connected iff every MST has n-1 edges', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const result = getAllMsts(nodes, edges);

        result.msts.forEach((mst) => {
          expect(mst.length === nodes.length - 1).toBe(result.connected);
        });
      }),
      { numRuns: 10 },
    );
  });

  it('every returned tree has Kruskal weight', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const all = getAllMsts(nodes, edges);
        const single = kruskals(nodes, edges);

        expect(all.totalWeight.equals(single.totalWeight)).toBe(true);
      }),
      { numRuns: 10 },
    );
  });

  it('all MSTs have the same number of edges', () => {
    fc.assert(
      fc.property(graphArbitrary, ({ nodes, edges }) => {
        const result = getAllMsts(nodes, edges);

        result.msts.forEach((mst) =>
          expect(mst.length).toBe(result.msts[0].length),
        );
      }),
      { numRuns: 10 },
    );
  });

  const normalizeMsts = (msts: Edge[][]) =>
    msts
      .map((mst) =>
        mst
          .map((e) => e.id)
          .sort()
          .join(','),
      )
      .sort();

  describe(getAllMsts, () => {
    it('is independent of the input edge ordering', () => {
      fc.assert(
        fc.property(graphArbitrary, fc.context(), ({ nodes, edges }, ctx) => {
          const original = getAllMsts(nodes, edges);

          for (let i = 0; i < 5; i++) {
            const shuffled = fc.sample(
              fc.shuffledSubarray(edges, {
                minLength: edges.length,
                maxLength: edges.length,
              }),
              1,
            )[0];

            const result = getAllMsts(nodes, shuffled);

            expect(result.connected).toBe(original.connected);
            expect(result.totalWeight.equals(original.totalWeight)).toBe(true);

            expect(normalizeMsts(result.msts)).toEqual(
              normalizeMsts(original.msts),
            );
          }
        }),
        {
          numRuns: 500,
        },
      );
    });
  });
});
