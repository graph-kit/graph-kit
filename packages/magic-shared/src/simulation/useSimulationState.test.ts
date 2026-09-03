import { nullThrows } from '@core/utils/assert';
import { describe, expect, it } from 'vitest';

import { defineComponent, isProxy, nextTick } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { SimulationDefinition } from './types.ts';
import { useSimulationState } from './useSimulationState.ts';

const SlotComponent = defineComponent({ template: '<div />' });

type Frame = { step: number };

const definition = (frameCount = 3) => ({
  id: 'test-sim',
  collectFrames: (collector: { add: (frame: Frame) => void }) => {
    for (let i = 0; i < frameCount; i++) collector.add({ step: i });
  },
  setup: () => ({
    lens: {
      id: 'test-lens',
      components: [
        {
          id: 'test-slot',
          component: SlotComponent,
          position: 'center-right' as const,
        },
      ],
      activate: () => {},
      deactivate: () => {},
    },
  }),
});

const harness = () => {
  const componentSlots = useComponentSlotsState();
  const lens = useLensState(componentSlots);
  const simulation = useSimulationState(componentSlots, lens);
  return { componentSlots, simulation };
};

describe('useSimulationState', () => {
  it('registers lens components without wrapping them in a reactive proxy', async () => {
    const { componentSlots, simulation } = harness();

    simulation.start(definition());
    await nextTick();

    const slot = componentSlots.entries.value.find((s) => s.id === 'test-slot');
    expect(slot).toBeDefined();
    expect(isProxy(slot?.component)).toBe(false);
    expect(slot?.component).toBe(SlotComponent);
  });

  it('keeps frames and playhead reactive across a recompute', async () => {
    const { simulation } = harness();

    simulation.start(definition(3));
    await nextTick();

    expect(simulation.current.value?.frameCount).toBe(3);

    simulation.current.value?.playhead.next();
    expect(simulation.current.value?.playhead.position).toBe(1);

    simulation.invalidate();
    expect(simulation.current.value?.frameCount).toBe(3);
    expect(simulation.current.value?.playhead.position).toBe(1);
  });

  it('exposes violations raised by a recompute', async () => {
    const { componentSlots, simulation } = harness();

    let invalid = false;
    simulation.start({
      ...definition(),
      guard: () => (invalid ? { id: 'broken' } : undefined),
    });
    await nextTick();

    expect(simulation.current.value?.violation).toBeUndefined();

    invalid = true;
    simulation.invalidate();
    expect(simulation.current.value?.violation?.id).toBe('broken');

    invalid = false;
    simulation.invalidate();
    expect(simulation.current.value?.violation).toBeUndefined();

    simulation.stop();
    await nextTick();
    expect(componentSlots.entries.value).toHaveLength(0);
  });
});

describe('useSimulationState with a generated frame source', () => {
  const generated = () => ({
    id: 'test-sim',
    frameAt: (position: number): Frame => ({ step: position }),
    setup: () => undefined,
  });

  it('reports an unbounded frame count and never reaches a last frame', async () => {
    const { simulation } = harness();

    simulation.start(generated());
    await nextTick();

    const sim = nullThrows(simulation.current.value, 'no simulation');
    expect(sim.frameCount).toBe(Infinity);
    expect(sim.playhead.isFirst()).toBe(true);
    expect(sim.playhead.isLast()).toBe(false);

    for (let i = 0; i < 500; i++) sim.playhead.next();

    expect(sim.playhead.position).toBe(500);
    expect(sim.playhead.isLast()).toBe(false);
    expect(sim.getFrame(sim.playhead.position)).toEqual({ step: 500 });
  });

  it('seeks to any non-negative position', async () => {
    const { simulation } = harness();

    simulation.start(generated());
    await nextTick();

    const sim = nullThrows(simulation.current.value, 'no simulation');
    sim.playhead.seek(1000);
    expect(sim.playhead.position).toBe(1000);
    expect(() => sim.playhead.seek(-1)).toThrow();
  });

  it('keeps its position across a recompute and re-reads the frame', async () => {
    const { simulation } = harness();

    let offset = 0;
    simulation.start({
      id: 'test-sim',
      frameAt: (position: number): Frame => ({ step: position + offset }),
      setup: () => undefined,
    });
    await nextTick();

    simulation.current.value?.playhead.seek(7);
    expect(simulation.current.value?.getFrame(7)).toEqual({ step: 7 });

    offset = 100;
    simulation.invalidate();

    expect(simulation.current.value?.playhead.position).toBe(7);
    expect(simulation.current.value?.getFrame(7)).toEqual({ step: 107 });
  });

  it('rejects a definition supplying both frame sources', () => {
    // @ts-expect-error a definition supplies exactly one frame source
    const both: SimulationDefinition<Frame> = {
      id: 'test-sim',
      collectFrames: (collector: { add: (frame: Frame) => void }) =>
        collector.add({ step: 0 }),
      frameAt: (position: number): Frame => ({ step: position }),
      setup: () => undefined,
    };

    expect(both).toBeDefined();
  });
});
