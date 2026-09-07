import type { CanvasSurface } from '@canvas/surface/types';
import type { Annotation, AnnotationsControls } from '@core/annotations/index';
import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { QUERY_COLORS } from '../constants.ts';
import { createQueries } from '../queries.ts';
import { createSetDefinitions } from '../setDefinitions.ts';
import { createSetsTransit } from './transit.ts';
import type { SetsTransitPayload } from './transit.ts';

/** only the camera, which is all transit asks a surface for */
const stubSurface = () =>
  ({
    camera: { state: { panX: ref(0), panY: ref(0), zoom: ref(1) } },
  }) as unknown as CanvasSurface;

/** only the two calls transit makes, since the engine itself needs a canvas */
const stubAnnotations = () => {
  let held: Annotation[] = [];
  return {
    annotations: () => held,
    setAll: (next: Annotation[]) => {
      held = next;
    },
  } as unknown as AnnotationsControls;
};

const setup = () => {
  const sets = createSetDefinitions();
  const queries = createQueries();
  const annotations = stubAnnotations();
  const surface = stubSurface();

  return {
    sets,
    queries,
    annotations,
    surface,
    transit: createSetsTransit({ sets, queries, annotations, surface }),
  };
};

const stroke: Annotation = {
  id: 'one',
  type: 'draw',
  points: [{ x: 1, y: 2 }],
  fillColor: '#ff0000',
  brushWeight: 4,
};

describe(createSetsTransit, () => {
  it('carries the whole canvas back into empty stores', () => {
    const source = setup();
    const first = source.sets.addDefinition({ x: 10, y: 20 });
    source.sets.addDefinition({ x: 30, y: 40 });
    source.queries.queries.value[0].editor.replace('A \\cup B');
    source.queries.addQuery().hidden = true;
    source.annotations.setAll([stroke]);
    source.surface.camera.state.zoom.value = 2;

    const destination = setup();
    destination.transit.decode(source.transit.encode());

    expect(
      destination.sets.definitions.value.map(({ label }) => label),
    ).toEqual(['A', 'B']);
    expect(destination.sets.definitions.value[0].display.at).toEqual({
      x: 10,
      y: 20,
    });
    expect(
      destination.queries.queries.value.map(({ latexQueryString, hidden }) => ({
        latexQueryString,
        hidden,
      })),
    ).toEqual([
      { latexQueryString: 'A \\cup B', hidden: false },
      { latexQueryString: '', hidden: true },
    ]);
    expect(destination.annotations.annotations()).toEqual([stroke]);
    expect(destination.surface.camera.state.zoom.value).toBe(2);

    // ids are minted on the way in, so nothing carries one across the boundary
    expect(destination.sets.definitions.value[0].id).not.toBe(first?.id);
  });

  it('replaces what was on the canvas rather than adding to it', () => {
    const { sets, queries, transit } = setup();
    sets.addDefinition({ x: 0, y: 0 });
    sets.addDefinition({ x: 0, y: 0 });

    transit.decode({
      sets: [{ label: 'C', x: 5, y: 5, radius: 40 }],
      queries: [],
      annotations: [],
      camera: { panX: 0, panY: 0, zoom: 1 },
    } satisfies SetsTransitPayload);

    expect(sets.definitions.value.map(({ label }) => label)).toEqual(['C']);
    // the panel is written around always having a field to type into
    expect(queries.queries.value).toHaveLength(1);
  });

  it('restores what it can from a payload missing keys', () => {
    const { sets, surface, transit } = setup();

    transit.decode({ sets: [{ label: 'A', x: 1, y: 2, radius: 40 }] });

    expect(sets.definitions.value).toHaveLength(1);
    // no camera in the payload leaves the one the user is already looking through
    expect(surface.camera.state.zoom.value).toBe(1);
  });

  it('encodes a query palette colour the codec can index', () => {
    const { queries, transit } = setup();
    queries.addQuery();

    const { queries: encoded } = transit.encode() as SetsTransitPayload;

    for (const { color } of encoded) expect(QUERY_COLORS).toContain(color);
  });
});
