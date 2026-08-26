import { DEFAULT_AUTO_ANIMATE_DURATION_MS } from '@canvas/primitives/animation/auto-animate/constants';
import { createAutoAnimate } from '@canvas/primitives/animation/auto-animate/createAutoAnimate';
import { describe, expect, it, vi } from 'vitest';

import { animation } from './index.ts';

const setup = () => {
  const playedDurations: number[] = [];

  const autoAnimate = createAutoAnimate(
    ((timeline: { durationMs: number }) => ({
      play: () => playedDurations.push(timeline.durationMs),
    })) as any,
    () => undefined,
    () => {},
  );

  /** shapes the draw pass reports, so a capture has something to animate */
  const scene: { id: string; at: { x: number; y: number }; radius: number }[] =
    [];

  const draw = () => {
    for (const schema of scene)
      autoAnimate.captureSchemaState(schema, 'circle');
  };

  const plugin = animation({
    controls: {
      surface: {
        renderer: { autoAnimate },
        aggregator: { draw },
        canvas: { getContext: () => ({}) },
      },
    },
  } as unknown as Parameters<typeof animation>[0]);

  const addCircle = () =>
    scene.push({ id: 'circle-1', at: { x: 0, y: 0 }, radius: 10 });

  return { ...plugin.controls, autoAnimate, addCircle, playedDurations };
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
