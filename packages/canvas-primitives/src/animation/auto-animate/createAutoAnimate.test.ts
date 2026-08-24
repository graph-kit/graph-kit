import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { SchemaId, ShapeName } from '../../types/index.ts';
import type { DefineTimeline, Timeline } from '../timeline/define.ts';
import type { LooseSchema } from '../types.ts';
import { arrowAdd } from './arrow/add.ts';
import { arrowRemove } from './arrow/remove.ts';
import { circleAdd } from './circle/add.ts';
import { circleRemove } from './circle/remove.ts';
import { AUTO_ANIMATE_DURATION_MS } from './constants.ts';
import { createAutoAnimate } from './createAutoAnimate.ts';

type PlayedAnimation = {
  shapeId: SchemaId;
  timeline: Timeline<any>;
  runCount?: number;
  onOver?: () => void;
};

type DrawRecord = {
  schemaId: SchemaId;
  override: { schema: LooseSchema } | 'suppress' | undefined;
};

/**
 * a stand-in for the animation engine and draw loop that createAutoAnimate is
 * wired into, so a whole capture/diff/ghost cycle can be driven without a
 * canvas or a clock. three contracts of the real system it deliberately
 * mirrors, because auto-animate's correctness leans on all of them:
 *
 * - `stopAllAnimations` runs each stopped animation's `onOver`, which is the
 *   only thing that ever clears a ghost
 * - a draw pass asks for the capture override immediately after capturing,
 *   the way the animated shape proxy does
 * - a draw pass skips ghost ids entirely, matching the `isGhost` guard that
 *   same proxy applies before it captures anything
 */
const createHarness = () => {
  const scene: Map<SchemaId, { schema: LooseSchema; shapeName: ShapeName }> =
    new Map();
  const liveSchemas: Map<SchemaId, LooseSchema> = new Map();
  const active: Map<SchemaId, PlayedAnimation[]> = new Map();

  const played: PlayedAnimation[] = [];
  const stopAllCalls: SchemaId[] = [];
  const drawLog: DrawRecord[] = [];

  const defineTimeline = ((timeline: Timeline<any>) => ({
    play: ({ shapeId, runCount, onOver }: any) => {
      const animation: PlayedAnimation = {
        shapeId,
        timeline,
        runCount,
        onOver,
      };
      played.push(animation);
      active.set(shapeId, [...(active.get(shapeId) ?? []), animation]);
    },
    pause: () => {},
    resume: () => {},
    stop: () => {},
    dispose: () => {},
  })) as unknown as DefineTimeline;

  const endAnimations = (shapeId: SchemaId) => {
    const animations = active.get(shapeId) ?? [];
    active.delete(shapeId);
    for (const animation of animations) animation.onOver?.();
  };

  const autoAnimate = createAutoAnimate(
    defineTimeline,
    (schemaId) => liveSchemas.get(schemaId),
    (shapeId) => {
      stopAllCalls.push(shapeId);
      endAnimations(shapeId);
    },
  );

  // the shipped render path never captures a ghost id, so this only exists to
  // reach the re-add-during-removal branch
  let captureGhosts = false;

  const flushDraw = () => {
    for (const [schemaId, entry] of scene) {
      if (!captureGhosts && autoAnimate.isGhost(schemaId)) continue;
      autoAnimate.captureSchemaState(entry.schema, entry.shapeName);
      drawLog.push({
        schemaId,
        override: autoAnimate.getCaptureOverride(schemaId),
      });
    }
  };

  return {
    autoAnimate,
    played,
    stopAllCalls,
    drawLog,

    activeAnimationCount: (shapeId: SchemaId) =>
      (active.get(shapeId) ?? []).length,

    /** simulates an animation exhausting its run count */
    endAnimations,

    setCaptureGhosts: (value: boolean) => {
      captureGhosts = value;
    },

    /** what `getAnimatedSchema` reports for a shape that is mid-animation */
    setLiveSchema: (schemaId: SchemaId, schema: LooseSchema) => {
      liveSchemas.set(schemaId, schema);
    },

    put: (shapeName: ShapeName, schema: LooseSchema) => {
      scene.set(schema.id, { schema, shapeName });
    },

    drop: (schemaId: SchemaId) => scene.delete(schemaId),

    clearLog: () => {
      played.length = 0;
      stopAllCalls.length = 0;
      drawLog.length = 0;
    },

    /** runs a mutation inside a capture window, the way the animation plugin does */
    mutate: (mutation: () => void) => {
      const finalize = autoAnimate.captureFrame(flushDraw);
      mutation();
      finalize();
    },

    /** opens a capture window and walks away from it */
    abandonCapture: () => autoAnimate.captureFrame(flushDraw),

    flushDraw,
  };
};

type SchemaOverrides = Omit<LooseSchema, 'id'>;

const circle = (
  id: SchemaId,
  overrides: SchemaOverrides = {},
): LooseSchema => ({
  id,
  at: { x: 0, y: 0 },
  radius: 10,
  fillColor: '#ff0000',
  ...overrides,
});

const arrow = (id: SchemaId, overrides: SchemaOverrides = {}): LooseSchema => ({
  id,
  start: { x: 0, y: 0 },
  end: { x: 100, y: 100 },
  lineWidth: 4,
  ...overrides,
});

const startProperties = (animation: PlayedAnimation) =>
  (animation.timeline.keyframes as any)[0].properties;
const endProperties = (animation: PlayedAnimation) =>
  (animation.timeline.keyframes as any)[1].properties;

let harness: ReturnType<typeof createHarness>;

beforeEach(() => {
  harness = createHarness();
});

describe('diffing a changed shape', () => {
  test('animates a moved circle from where it was to where it went', () => {
    harness.put('circle', circle('circle-1'));

    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { at: { x: 100, y: 50 } }));
    });

    expect(harness.played).toHaveLength(1);
    const [animation] = harness.played;
    expect(animation.shapeId).toBe('circle-1');
    expect(startProperties(animation)).toEqual({ at: { x: 0, y: 0 } });
    expect(endProperties(animation)).toEqual({ at: { x: 100, y: 50 } });
  });

  test('carries the whole value of a property that only partially changed', () => {
    harness.put('circle', circle('circle-1'));

    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { at: { x: 100, y: 0 } }));
    });

    // the diff sees only `at.x`, but a coordinate cannot be animated from half
    // a point, so both axes have to make it into the keyframe
    expect(startProperties(harness.played[0])).toEqual({ at: { x: 0, y: 0 } });
  });

  test('animates every changed property in a single timeline', () => {
    harness.put('circle', circle('circle-1'));

    harness.mutate(() => {
      harness.put(
        'circle',
        circle('circle-1', { radius: 30, fillColor: '#0000ff' }),
      );
    });

    expect(harness.played).toHaveLength(1);
    expect(startProperties(harness.played[0])).toEqual({
      radius: 10,
      fillColor: '#ff0000',
    });
    expect(endProperties(harness.played[0])).toEqual({
      radius: 30,
      fillColor: '#0000ff',
    });
  });

  test('plays the timeline once, for the right shape, at the standard duration', () => {
    harness.put('circle', circle('circle-1'));

    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { radius: 30 }));
    });

    const [animation] = harness.played;
    expect(animation.runCount).toBe(1);
    expect(animation.timeline.forShapes).toEqual(['circle']);
    expect(animation.timeline.durationMs).toBe(AUTO_ANIMATE_DURATION_MS);
  });

  test('plays nothing when a mutation leaves every shape untouched', () => {
    harness.put('circle', circle('circle-1'));
    harness.put('arrow', arrow('arrow-1'));

    harness.mutate(() => {});

    expect(harness.played).toHaveLength(0);
    expect(harness.stopAllCalls).toHaveLength(0);
  });

  test('refuses to animate a shape that changed type, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    harness.put('circle', circle('shape-1'));

    harness.mutate(() => {
      harness.put('arrow', arrow('shape-1'));
    });

    expect(harness.played).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Animating between shapes is unsupported'),
    );
    warn.mockRestore();
  });

  test('a change to an unsupported property alone still plays an empty timeline', () => {
    // known issue, flagged in createAutoAnimate: the supported-property filter
    // runs after the decision to animate, so renaming a node stops whatever was
    // running and holds the shape in an empty 500ms animation
    harness.put(
      'circle',
      circle('circle-1', {
        textArea: { id: 'ta-1', textBlock: { content: 'before' } },
      }),
    );

    harness.mutate(() => {
      harness.put(
        'circle',
        circle('circle-1', {
          textArea: { id: 'ta-1', textBlock: { content: 'after' } },
        }),
      );
    });

    expect(harness.played).toHaveLength(1);
    expect(startProperties(harness.played[0])).toEqual({});
    expect(harness.stopAllCalls).toEqual(['circle-1']);
  });
});

describe('shapes that appeared', () => {
  test('plays the entrance timeline for a circle', () => {
    harness.mutate(() => harness.put('circle', circle('circle-1')));

    expect(harness.played).toHaveLength(1);
    expect(harness.played[0].timeline).toBe(circleAdd);
    expect(harness.played[0].shapeId).toBe('circle-1');
  });

  test('plays the entrance timeline for an arrow', () => {
    harness.mutate(() => harness.put('arrow', arrow('arrow-1')));

    expect(harness.played[0].timeline).toBe(arrowAdd);
  });

  test('leaves a shape with no entrance timeline alone', () => {
    harness.mutate(() =>
      harness.put('rect', {
        id: 'rect-1',
        at: { x: 0, y: 0 },
        width: 10,
        height: 10,
      }),
    );

    expect(harness.played).toHaveLength(0);
  });

  test('draws nothing for a shape that appeared mid-capture', () => {
    harness.mutate(() => harness.put('circle', circle('circle-1')));

    // the only pass that sees it is the "after" one, and it has no earlier
    // state to hold on, so it must be kept off the canvas rather than flash
    expect(harness.drawLog).toEqual([
      { schemaId: 'circle-1', override: 'suppress' },
    ]);
  });
});

describe('shapes that disappeared', () => {
  test('keeps a removed circle as a ghost and plays its exit timeline', () => {
    harness.put('circle', circle('circle-1'));

    harness.mutate(() => harness.drop('circle-1'));

    expect(harness.played).toHaveLength(1);
    expect(harness.played[0].timeline).toBe(circleRemove);
    expect(harness.autoAnimate.isGhost('circle-1')).toBe(true);
    expect(harness.autoAnimate.getGhosts()[0].schema).toMatchObject({
      shapeName: 'circle',
      radius: 10,
    });
  });

  test('plays the exit timeline for an arrow', () => {
    harness.put('arrow', arrow('arrow-1'));

    harness.mutate(() => harness.drop('arrow-1'));

    expect(harness.played[0].timeline).toBe(arrowRemove);
  });

  test('drops the ghost once the exit animation is over', () => {
    harness.put('circle', circle('circle-1'));
    harness.mutate(() => harness.drop('circle-1'));

    harness.endAnimations('circle-1');

    expect(harness.autoAnimate.isGhost('circle-1')).toBe(false);
    expect(harness.autoAnimate.getGhosts()).toHaveLength(0);
  });

  test('remembers the draw order each ghost held before it was removed', () => {
    harness.put('circle', circle('first'));
    harness.put('circle', circle('second'));
    harness.put('circle', circle('third'));

    harness.mutate(() => harness.drop('third'));
    harness.mutate(() => harness.drop('first'));

    // 'third' became a ghost first, but it sat behind 'first' on the canvas,
    // and that is the order it has to be spliced back into
    expect(harness.autoAnimate.getGhosts().map(({ id }) => id)).toEqual([
      'first',
      'third',
    ]);
    expect(
      harness.autoAnimate.getGhosts().map(({ orderIndex }) => orderIndex),
    ).toEqual([0, 2]);
  });

  test('strands the ghost of a shape that has no exit timeline', () => {
    // known issue: the ghost is registered before the shape name is checked,
    // and only an animation's onOver ever clears one, so a removed rect is
    // drawn frozen in place for the rest of the session
    harness.put('rect', {
      id: 'rect-1',
      at: { x: 0, y: 0 },
      width: 10,
      height: 10,
    });

    harness.mutate(() => harness.drop('rect-1'));

    expect(harness.played).toHaveLength(0);
    expect(harness.autoAnimate.isGhost('rect-1')).toBe(true);
  });
});

describe('the capture window', () => {
  test('holds a mutated shape on its pre-mutation schema for both passes', () => {
    harness.put('circle', circle('circle-1'));

    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { at: { x: 100, y: 100 } }));
    });

    expect(harness.drawLog).toHaveLength(2);
    for (const record of harness.drawLog) {
      expect(record.override).toMatchObject({ schema: { at: { x: 0, y: 0 } } });
    }
  });

  test('stops overriding anything once the window closes', () => {
    harness.put('circle', circle('circle-1'));
    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { radius: 30 }));
    });
    harness.clearLog();

    harness.flushDraw();

    expect(harness.drawLog).toEqual([
      { schemaId: 'circle-1', override: undefined },
    ]);
  });

  test('captures a shape once per pass however many times it is asked', () => {
    // the animated shape proxy calls into capture on every single property
    // read, so only the first call within a pass can be allowed to count
    const finalize = harness.autoAnimate.captureFrame(() => {
      harness.autoAnimate.captureSchemaState(circle('circle-1'), 'circle');
      harness.autoAnimate.captureSchemaState(
        circle('circle-1', { at: { x: 999, y: 999 } }),
        'circle',
      );
    });
    const override = harness.autoAnimate.getCaptureOverride('circle-1');
    finalize();

    expect(override).toMatchObject({ schema: { at: { x: 0, y: 0 } } });
  });

  test('ignores captures taken outside a window', () => {
    harness.autoAnimate.captureSchemaState(circle('circle-1'), 'circle');

    expect(harness.autoAnimate.getCaptureOverride('circle-1')).toBeUndefined();
  });

  test('throws away snapshots left by a window that never finalized', () => {
    harness.put('circle', circle('circle-1'));
    harness.put('circle', circle('circle-2'));
    harness.abandonCapture();
    harness.drop('circle-2');
    harness.clearLog();

    harness.mutate(() => {});

    // circle-2 left the scene while the abandoned window still held a "before"
    // for it. carried into this frame, that snapshot reads as a removal and
    // would strand a ghost for a shape nobody touched
    expect(harness.played).toHaveLength(0);
    expect(harness.autoAnimate.isGhost('circle-2')).toBe(false);
  });
});

describe('mutating a shape that is already animating', () => {
  test('starts from where the shape currently looks, not where it rests', () => {
    harness.put('circle', circle('circle-1'));
    harness.setLiveSchema('circle-1', circle('circle-1', { radius: 22 }));

    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { radius: 40 }));
    });

    expect(startProperties(harness.played[0])).toEqual({ radius: 22 });
    expect(endProperties(harness.played[0])).toEqual({ radius: 40 });
  });

  test('clears the running animation before starting the new one', () => {
    harness.put('circle', circle('circle-1'));
    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { radius: 20 }));
    });
    const [first] = harness.played;
    const firstEnded = vi.fn();
    first.onOver = firstEnded;
    harness.clearLog();

    harness.mutate(() => {
      harness.put('circle', circle('circle-1', { radius: 30 }));
    });

    expect(harness.stopAllCalls).toEqual(['circle-1']);
    expect(firstEnded).toHaveBeenCalled();
    expect(harness.activeAnimationCount('circle-1')).toBe(1);
  });
});

describe('re-adding a shape while its exit animation is still playing', () => {
  const removeThenReadd = (readded: LooseSchema) => {
    harness.put('circle', circle('circle-1'));
    harness.mutate(() => harness.drop('circle-1'));
    harness.clearLog();
    harness.mutate(() => harness.put('circle', readded));
  };

  test('the render path never reaches the continuation branch', () => {
    // both the real shape proxy and this harness skip ghost ids when
    // capturing, so a re-added shape produces no "after" snapshot at all: no
    // animation starts and it keeps rendering as a shrinking ghost
    removeThenReadd(circle('circle-1', { radius: 40 }));

    expect(harness.played).toHaveLength(0);
    expect(harness.autoAnimate.isGhost('circle-1')).toBe(true);
  });

  test('continues from the ghost rather than replaying the entrance', () => {
    harness.setCaptureGhosts(true);
    harness.setLiveSchema('circle-1', circle('circle-1', { radius: 4 }));

    removeThenReadd(circle('circle-1', { radius: 40 }));

    expect(harness.played).toHaveLength(1);
    expect(harness.played[0].timeline).not.toBe(circleAdd);
    expect(startProperties(harness.played[0])).toEqual({ radius: 4 });
    expect(endProperties(harness.played[0])).toEqual({ radius: 40 });
    expect(harness.autoAnimate.isGhost('circle-1')).toBe(false);
  });

  test('just cancels the removal when the shape came back unchanged', () => {
    harness.setCaptureGhosts(true);
    harness.setLiveSchema('circle-1', circle('circle-1'));

    removeThenReadd(circle('circle-1'));

    expect(harness.played).toHaveLength(0);
    expect(harness.stopAllCalls).toEqual(['circle-1']);
    expect(harness.autoAnimate.isGhost('circle-1')).toBe(false);
  });
});
