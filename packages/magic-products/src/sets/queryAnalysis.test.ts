import { describe, expect, it } from 'vitest';

import { createQueries } from './queries.ts';
import { QUERY_ERRORS, useQueryAnalysis } from './queryAnalysis.ts';
import { createSetDefinitions } from './setDefinitions.ts';
import { useSections } from './sets/composables/useSections.ts';

/**
 * a canvas holding `setCount` overlapping sets, labelled A onwards, with one query
 * on it. reads back why that query does not resolve, undefined when it does
 */
const errorFor = (latex: string, setCount = 2) => {
  const sets = createSetDefinitions();
  // spaced under the default radius, so every set overlaps and the partition is whole
  for (let i = 0; i < setCount; i++) sets.addDefinition({ x: i * 20, y: 0 });

  const queries = createQueries();
  const [query] = queries.queries.value;
  query.editor.replace(latex);

  const { queryErrors } = useQueryAnalysis(
    queries,
    sets,
    useSections(sets.definitions),
  );

  return queryErrors.value[query.id];
};

describe('why a query is turned down', () => {
  it('says nothing about a query that reads fine', () => {
    expect(errorFor('A \\cup B')).toBeUndefined();
    expect(errorFor('\\neg A')).toBeUndefined();
    expect(errorFor('\\Omega \\setminus S')).toBeUndefined();
  });

  it('says nothing about an empty query, which selects nothing rather than erroring', () => {
    expect(errorFor('')).toBeUndefined();
    expect(errorFor('   ')).toBeUndefined();
  });

  it('calls an expression left mid-write unfinished', () => {
    expect(errorFor('A \\cup')).toBe(QUERY_ERRORS.unreadable);
    expect(errorFor('A \\cup (B')).toBe(QUERY_ERRORS.unreadable);
    expect(errorFor('\\cup A')).toBe(QUERY_ERRORS.unreadable);
  });

  it('calls maths that is not over sets out as such', () => {
    expect(errorFor('A + B')).toBe(QUERY_ERRORS.notSetNotation);
    expect(errorFor('2')).toBe(QUERY_ERRORS.notSetNotation);
    expect(errorFor('\\frac{A}{B}')).toBe(QUERY_ERRORS.notSetNotation);
  });

  it('names the set that is not on the canvas', () => {
    expect(errorFor('A \\cup C')).toBe('No set named C is on the canvas.');
    expect(errorFor('C \\cap D')).toBe(
      'No sets named C or D are on the canvas.',
    );
    expect(errorFor('C \\cup D \\cup E')).toBe(
      'No sets named C, D or E are on the canvas.',
    );
  });

  /*
    with an empty canvas there is no set space to be wrong about yet, so a query
    naming one is left alone rather than told off for every letter in it
  */
  it('holds off naming undefined sets until something is drawn', () => {
    expect(errorFor('A \\cup B', 0)).toBeUndefined();
  });
});
