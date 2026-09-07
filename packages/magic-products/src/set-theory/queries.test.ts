import { describe, expect, it, vi } from 'vitest';

import { QUERY_COLORS } from './constants.ts';
import { createQueries } from './queries.ts';

const encoded = (latexQueryString: string, hidden = false, color?: string) => ({
  latexQueryString,
  hidden,
  color: color ?? QUERY_COLORS[0],
});

describe(createQueries, () => {
  it('opens on one blank query, since the panel always needs a field', () => {
    const { queries } = createQueries();

    expect(queries.value).toHaveLength(1);
    expect(queries.value[0].latexQueryString).toBe('');
  });

  it('reports every way a query is written', () => {
    const queries = createQueries();
    const changed = vi.fn();
    queries.events.subscribe('onQueriesChanged', changed);

    const added = queries.addQuery();
    added.editor.replace('A \\cup B');
    added.hidden = true;
    queries.removeQuery(added.id);

    expect(changed).toHaveBeenCalledTimes(4);
  });

  it('stays quiet for a write that changed nothing', () => {
    const queries = createQueries();
    const [only] = queries.queries.value;
    only.editor.replace('A');
    only.hidden = true;
    const changed = vi.fn();
    queries.events.subscribe('onQueriesChanged', changed);

    only.editor.replace('A');
    only.hidden = true;
    queries.removeQuery('not-a-query');

    expect(changed).not.toHaveBeenCalled();
  });

  describe('the path a decode arrives on', () => {
    it('restores latex and visibility without a mathfield mounted', () => {
      const queries = createQueries();

      queries.setAll([encoded('A \\cap B', true), encoded('B')]);

      expect(
        queries.queries.value.map(({ latexQueryString, hidden }) => ({
          latexQueryString,
          hidden,
        })),
      ).toEqual([
        { latexQueryString: 'A \\cap B', hidden: true },
        { latexQueryString: 'B', hidden: false },
      ]);
    });

    it('leaves one blank query behind rather than an empty panel', () => {
      const queries = createQueries();

      queries.setAll([]);

      expect(queries.queries.value).toHaveLength(1);
      expect(queries.queries.value[0].latexQueryString).toBe('');
    });

    it('keeps a color off the palette out of the fill', () => {
      const queries = createQueries();

      queries.setAll([encoded('A', false, 'javascript:alert(1)')]);

      expect(QUERY_COLORS).toContain(queries.queries.value[0].color);
    });

    it('hands restored queries ids of their own', () => {
      const queries = createQueries();

      queries.setAll([encoded('A'), encoded('B')]);

      const [first, second] = queries.queries.value;
      expect(first.id).not.toBe(second.id);
      expect(queries.getQuery(second.id).latexQueryString).toBe('B');
    });

    it('reports restored queries as a change, so they get persisted', () => {
      const queries = createQueries();
      const changed = vi.fn();
      queries.events.subscribe('onQueriesChanged', changed);

      queries.setAll([encoded('A')]);

      expect(changed).toHaveBeenCalledOnce();
    });
  });
});
