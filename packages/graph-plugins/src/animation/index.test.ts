import { DEFAULT_AUTO_ANIMATE_DURATION_MS } from '@canvas/primitives/animation/auto-animate/constants';
import { createAutoAnimate } from '@canvas/primitives/animation/auto-animate/createAutoAnimate';
import { describe, expect, it, vi } from 'vitest';

import { animation } from './index.ts';

const setup = () => {
  const autoAnimate = createAutoAnimate(
    (() => ({ play: () => {} })) as any,
    () => undefined,
    () => {},
  );

  const plugin = animation({
    controls: {
      surface: {
        renderer: { autoAnimate },
        aggregator: { draw: () => {} },
        canvas: undefined,
      },
    },
  } as unknown as Parameters<typeof animation>[0]);

  return { ...plugin.controls, autoAnimate };
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
