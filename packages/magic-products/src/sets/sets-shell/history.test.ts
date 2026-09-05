import type { CanvasSurface } from '@canvas/surface/types';
import { createAnnotations } from '@core/annotations/index';
import type { Annotation } from '@core/annotations/index';
import { beforeEach, describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { createQueries } from '../queries.ts';
import { createSetDefinitions } from '../setDefinitions.ts';
import { createSetGestures } from '../setGestures.ts';
import { createSetsHistory } from './history.ts';
import { createSetsTransit } from './transit.ts';

const stubSurface = () =>
  ({
    camera: { state: { panX: ref(0), panY: ref(0), zoom: ref(1) } },
    aggregator: { addTransformer: () => {} },
    events: {
      elements: { handle: () => {}, unhandle: () => {} },
      canvas: { subscribe: () => {}, unsubscribe: () => {} },
      dom: { subscribe: () => {}, unsubscribe: () => {} },
    },
  }) as unknown as CanvasSurface;

const stroke = (id: string): Annotation => ({
  id,
  type: 'draw',
  points: [{ x: 1, y: 2 }],
  fillColor: '#ff0000',
  brushWeight: 4,
});

const setup = () => {
  const sets = createSetDefinitions();
  const queries = createQueries();
  const annotations = createAnnotations({ surface: stubSurface() });
  const gestures = createSetGestures();
  const surface = stubSurface();

  const transit = createSetsTransit({ sets, queries, annotations, surface });
  const history = createSetsHistory({ transit, sets, annotations, gestures });

  return { sets, annotations, gestures, history, transit };
};

/** a whole gesture: take hold, move, let go */
const dragTo = (
  { sets, gestures }: ReturnType<typeof setup>,
  setId: string,
  by: { x: number; y: number },
) => {
  gestures.report.held(setId);
  sets.moveDefinition(setId, by);
  gestures.report.released(setId);
};

const labelsOf = (sets: ReturnType<typeof setup>['sets']) =>
  sets.definitions.value.map(({ label }) => label);

const positionOf = (sets: ReturnType<typeof setup>['sets'], label: string) => {
  const found = sets.definitions.value.find(
    (definition) => definition.label === label,
  );
  return found && { ...found.display.at };
};

describe(createSetsHistory, () => {
  let world: ReturnType<typeof setup>;

  beforeEach(() => {
    world = setup();
  });

  it('opens with nothing to walk back to', () => {
    expect(world.history.canUndo.value).toBe(false);
    expect(world.history.canRedo.value).toBe(false);
  });

  it('walks an added set back and forward again', () => {
    world.sets.addDefinition({ x: 10, y: 10 });

    world.history.undo();
    expect(labelsOf(world.sets)).toEqual([]);

    world.history.redo();
    expect(labelsOf(world.sets)).toEqual(['A']);
    expect(positionOf(world.sets, 'A')).toEqual({ x: 10, y: 10 });
  });

  it('takes a whole drag as one step rather than one per frame', () => {
    const added = world.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was empty');

    world.gestures.report.held(added.id);
    for (let frame = 0; frame < 10; frame++) {
      world.sets.moveDefinition(added.id, { x: 1, y: 0 });
    }
    world.gestures.report.released(added.id);

    expect(positionOf(world.sets, 'A')).toEqual({ x: 10, y: 0 });

    world.history.undo();
    expect(positionOf(world.sets, 'A')).toEqual({ x: 0, y: 0 });
    // the set is still there: one undo took the drag, not the set with it
    expect(labelsOf(world.sets)).toEqual(['A']);
  });

  it('does not record a press that let go where it started', () => {
    const added = world.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was empty');
    world.history.clear();

    world.gestures.report.held(added.id);
    world.gestures.report.released(added.id);

    expect(world.history.canUndo.value).toBe(false);
  });

  it('walks a resize back', () => {
    const added = world.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was empty');
    const original = added.display.radius;

    world.gestures.report.held(added.id);
    world.sets.resizeDefinition(added.id, 200);
    world.gestures.report.released(added.id);

    world.history.undo();

    expect(world.sets.definitions.value[0].display.radius).toBe(original);
  });

  describe('annotations, which are steps of their own', () => {
    it('takes a stroke back without moving the circles', () => {
      world.sets.addDefinition({ x: 10, y: 10 });
      world.annotations.add([stroke('one')]);

      world.history.undo();

      expect(world.annotations.annotations()).toEqual([]);
      expect(labelsOf(world.sets)).toEqual(['A']);
      expect(positionOf(world.sets, 'A')).toEqual({ x: 10, y: 10 });
    });

    it('puts an erased stroke back', () => {
      world.annotations.add([stroke('one'), stroke('two')]);
      world.annotations.remove(['one']);

      world.history.undo();

      expect(world.annotations.annotations().map(({ id }) => id)).toEqual([
        'two',
        'one',
      ]);
    });

    it('moves a circle without re-recording the strokes on the canvas', () => {
      const added = world.sets.addDefinition({ x: 0, y: 0 });
      if (!added) throw new Error('the canvas was empty');
      world.annotations.add([stroke('one')]);

      dragTo(world, added.id, { x: 50, y: 0 });

      // undoing the drag leaves the stroke alone, which is the whole point of the split
      world.history.undo();
      expect(world.annotations.annotations().map(({ id }) => id)).toEqual([
        'one',
      ]);
      expect(positionOf(world.sets, 'A')).toEqual({ x: 0, y: 0 });
    });
  });

  it('walks interleaved edits back in the order they were made', () => {
    const added = world.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was empty');
    world.annotations.add([stroke('one')]);
    dragTo(world, added.id, { x: 30, y: 0 });

    world.history.undo();
    expect(positionOf(world.sets, 'A')).toEqual({ x: 0, y: 0 });
    expect(world.annotations.annotations()).toHaveLength(1);

    world.history.undo();
    expect(world.annotations.annotations()).toEqual([]);
    expect(labelsOf(world.sets)).toEqual(['A']);

    world.history.undo();
    expect(labelsOf(world.sets)).toEqual([]);
    expect(world.history.canUndo.value).toBe(false);
  });

  it('drops the branch it walked away from when a new edit lands', () => {
    world.sets.addDefinition({ x: 0, y: 0 });
    world.sets.addDefinition({ x: 100, y: 0 });

    world.history.undo();
    expect(world.history.canRedo.value).toBe(true);

    world.sets.addDefinition({ x: 200, y: 0 });

    expect(world.history.canRedo.value).toBe(false);
    expect(labelsOf(world.sets)).toEqual(['A', 'B']);
  });

  it('makes what is on screen the new starting point when cleared', () => {
    world.sets.addDefinition({ x: 0, y: 0 });
    world.annotations.add([stroke('one')]);

    world.history.clear();

    expect(world.history.canUndo.value).toBe(false);
    expect(world.history.canRedo.value).toBe(false);
  });

  it('records nothing for the walking itself', () => {
    world.sets.addDefinition({ x: 0, y: 0 });
    world.annotations.add([stroke('one')]);

    world.history.undo();
    world.history.undo();
    world.history.redo();
    world.history.redo();

    // back where it started, with the same two steps behind it and none added
    expect(labelsOf(world.sets)).toEqual(['A']);
    expect(world.annotations.annotations()).toHaveLength(1);
    expect(world.history.canRedo.value).toBe(false);

    world.history.undo();
    world.history.undo();
    expect(world.history.canUndo.value).toBe(false);
  });
});
