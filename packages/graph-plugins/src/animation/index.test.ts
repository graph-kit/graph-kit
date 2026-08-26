import { DEFAULT_AUTO_ANIMATE_DURATION_MS } from '@canvas/primitives/animation/auto-animate/constants';
import { createAutoAnimate } from '@canvas/primitives/animation/auto-animate/createAutoAnimate';
import { describe, expect, it, vi } from 'vitest';

import { animation } from './index.ts';

const animatedProperties = (timeline: any) =>
  Object.keys(timeline.keyframes[0].properties).sort();

const setup = () => {
  const playedDurations: number[] = [];
  const playedTimelines: any[] = [];

  const autoAnimate = createAutoAnimate(
    ((timeline: { durationMs: number }) => ({
      play: () => {
        playedDurations.push(timeline.durationMs);
        playedTimelines.push(timeline);
      },
    })) as any,
    () => undefined,
    () => {},
  );

  /** shapes the draw pass reports, so a capture has something to animate */
  const scene: { id: string; fillColor: string }[] = [];

  // mirrors the render path: a shape's geometry is read from the presented position
  const draw = () => {
    for (const node of scene) {
      autoAnimate.captureSchemaState(
        {
          id: node.id,
          at: { ...positions.presented.get(node.id) },
          radius: 10,
          fillColor: node.fillColor,
        },
        'circle',
      );
    }
  };

  const committed = new Map<string, { x: number; y: number; z: number }>();
  const overrides = new Map<string, { x: number; y: number; z: number }>();

  const positions = {
    get: (nodeId: string) => committed.get(nodeId) ?? { x: 0, y: 0, z: 0 },
    presented: {
      get: (nodeId: string) => overrides.get(nodeId) ?? positions.get(nodeId),
      set: (nodeId: string, position: { x: number; y: number; z: number }) => {
        overrides.set(nodeId, {
          ...positions.presented.get(nodeId),
          ...position,
        });
      },
      clear: (nodeId: string) => overrides.delete(nodeId),
    },
    createStream: () => ({
      setMany: (
        updates: { nodeId: string; update: { x: number; y: number } }[],
      ) => {
        for (const { nodeId, update } of updates) {
          positions.presented.set(nodeId, {
            ...positions.presented.get(nodeId),
            ...update,
          });
        }
        return updates;
      },
      cancel: () => {
        for (const nodeId of [...overrides.keys()]) overrides.delete(nodeId);
      },
    }),
  };

  const plugin = animation({
    controls: {
      surface: {
        renderer: { autoAnimate },
        aggregator: { draw },
        canvas: { getContext: () => ({}) },
      },
      positions,
      nodes: () => scene.map(({ id }) => ({ id })),
      edges: () => [],
      isNode: (nodeId: string) => scene.some(({ id }) => id === nodeId),
    },
  } as unknown as Parameters<typeof animation>[0]);

  const addCircle = () => scene.push({ id: 'circle-1', fillColor: '#ff0000' });

  const moveNode = (nodeId: string, x: number, y: number) =>
    committed.set(nodeId, { x, y, z: 0 });

  const recolorNode = (nodeId: string, fillColor: string) => {
    const node = scene.find(({ id }) => id === nodeId);
    if (node) node.fillColor = fillColor;
  };

  return {
    ...plugin.controls,
    autoAnimate,
    addCircle,
    moveNode,
    recolorNode,
    positions,
    playedDurations,
    playedTimelines,
  };
};

describe(animation, () => {
  it('starts on whatever duration the renderer was already at', () => {
    const { duration } = setup();
    expect(duration()).toBe(DEFAULT_AUTO_ANIMATE_DURATION_MS);
  });

  it('drives the renderer and the signal together', () => {
    const { duration, setDuration, autoAnimate } = setup();

    setDuration(1200);

    expect(duration()).toBe(1200);
    expect(autoAnimate.animationDuration).toBe(1200);
  });

  it('reports the change with the new duration and the one it replaced', () => {
    const { setDuration, events } = setup();
    const onChange = vi.fn();
    events.subscribe('onAnimationDurationChanged', onChange);

    setDuration(1200);

    expect(onChange).toHaveBeenCalledWith(
      1200,
      DEFAULT_AUTO_ANIMATE_DURATION_MS,
    );
  });

  it('stays quiet when the duration is set to what it already was', () => {
    const { setDuration, events } = setup();
    const onChange = vi.fn();
    events.subscribe('onAnimationDurationChanged', onChange);

    setDuration(DEFAULT_AUTO_ANIMATE_DURATION_MS);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('plays a capture at the duration it was handed', () => {
    const { capture, addCircle, playedDurations } = setup();

    capture(addCircle, { durationMs: 300 });

    expect(playedDurations).toEqual([300]);
  });

  it('plays a capture at the set duration when handed none', () => {
    const { capture, addCircle, playedDurations } = setup();

    capture(addCircle);

    expect(playedDurations).toEqual([DEFAULT_AUTO_ANIMATE_DURATION_MS]);
  });

  it('keeps a capture override off the signal and the events', () => {
    const { capture, duration, events, autoAnimate, addCircle } = setup();
    const onChange = vi.fn();
    events.subscribe('onAnimationDurationChanged', onChange);

    capture(addCircle, { durationMs: 300 });

    expect(duration()).toBe(DEFAULT_AUTO_ANIMATE_DURATION_MS);
    expect(autoAnimate.animationDuration).toBe(
      DEFAULT_AUTO_ANIMATE_DURATION_MS,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hands the duration back even when the mutation throws', () => {
    const { capture, autoAnimate } = setup();

    expect(() =>
      capture(
        () => {
          throw new Error('mutation blew up');
        },
        { durationMs: 300 },
      ),
    ).toThrow('mutation blew up');

    expect(autoAnimate.animationDuration).toBe(
      DEFAULT_AUTO_ANIMATE_DURATION_MS,
    );
  });

  it('leaves a pure move to the position layer', () => {
    const { capture, addCircle, moveNode, playedTimelines } = setup();
    addCircle();

    capture(() => moveNode('circle-1', 100, 100));

    expect(playedTimelines).toEqual([]);
  });

  it('presents a moved node where it was, not where it landed', () => {
    const { capture, addCircle, moveNode, positions } = setup();
    addCircle();

    capture(() => moveNode('circle-1', 100, 100));

    expect(positions.presented.get('circle-1')).toMatchObject({ x: 0, y: 0 });
    expect(positions.get('circle-1')).toMatchObject({ x: 100, y: 100 });
  });

  it('still animates a colour change on a node that moved', () => {
    const { capture, addCircle, moveNode, recolorNode, playedTimelines } =
      setup();
    addCircle();

    capture(() => {
      moveNode('circle-1', 100, 100);
      recolorNode('circle-1', '#00ff00');
    });

    expect(playedTimelines).toHaveLength(1);
    expect(animatedProperties(playedTimelines[0])).toEqual(['fillColor']);
  });

  it('still plays an entrance for a node that appeared', () => {
    const { capture, addCircle, playedTimelines } = setup();

    capture(addCircle);

    expect(playedTimelines).toHaveLength(1);
    expect(animatedProperties(playedTimelines[0])).toContain('radius');
  });

  it('leaves the signal alone when the renderer refuses the duration', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { duration, setDuration, events } = setup();
    const onChange = vi.fn();
    events.subscribe('onAnimationDurationChanged', onChange);

    setDuration(-1);

    expect(duration()).toBe(DEFAULT_AUTO_ANIMATE_DURATION_MS);
    expect(onChange).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
