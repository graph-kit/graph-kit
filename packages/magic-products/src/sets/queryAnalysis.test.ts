import { describe, expect, it } from 'vitest';

import { useSections } from './composables/useSections.ts';
import { createQueries } from './queries.ts';
import { QUERY_ERRORS, useQueryAnalysis } from './queryAnalysis.ts';
import { createSetDefinitions } from './setDefinitions.ts';

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
    expect(errorFor('A \\cup C')).toBe('No set named C');
    expect(errorFor('C \\cap D')).toBe('No sets named C or D');
    expect(errorFor('C \\cup D \\cup E')).toBe('No sets named C, D or E');
  });

  // an empty canvas defines no labels, so every set a query names is one that is not there
  it('names a set on an empty canvas as missing too', () => {
    expect(errorFor('A', 0)).toBe('No set named A');
    expect(errorFor('A \\cup B', 0)).toBe('No sets named A or B');
  });

  // neither is a name a set can hold, so neither goes missing with nothing drawn
  it('still reads the universal set and the outside region on an empty canvas', () => {
    expect(errorFor('\\Omega', 0)).toBeUndefined();
    expect(errorFor('S', 0)).toBeUndefined();
    expect(errorFor('\\Omega \\setminus S', 0)).toBeUndefined();
  });
});

/*
  the error is read off a computed chain reaching through the set space, the
  partition and the query's own latex, so each of those has to move it on its own
*/
describe('an error following the canvas it is read against', () => {
  const canvas = () => {
    const sets = createSetDefinitions();
    const queries = createQueries();
    const [query] = queries.queries.value;
    const { queryErrors } = useQueryAnalysis(
      queries,
      sets,
      useSections(sets.definitions),
    );

    return {
      sets,
      query,
      error: () => queryErrors.value[query.id],
    };
  };

  it('clears once the set the query names is drawn', () => {
    const { sets, query, error } = canvas();

    query.editor.replace('A');
    expect(error()).toBe('No set named A');

    sets.addDefinition({ x: 0, y: 0 });
    expect(error()).toBeUndefined();
  });

  it('returns once that set is removed again', () => {
    const { sets, query, error } = canvas();

    sets.addDefinition({ x: 0, y: 0 });
    query.editor.replace('A');
    expect(error()).toBeUndefined();

    sets.removeDefinition(sets.definitions.value[0].id);
    expect(error()).toBe('No set named A');
  });

  it('follows the query being rewritten under a canvas that has not moved', () => {
    const { sets, query, error } = canvas();
    sets.addDefinition({ x: 0, y: 0 });

    query.editor.replace('B');
    expect(error()).toBe('No set named B');

    query.editor.replace('A');
    expect(error()).toBeUndefined();

    query.editor.replace('A \\cup');
    expect(error()).toBe(QUERY_ERRORS.unreadable);
  });
});
