import { describe, expect, it } from 'vitest';

import { defineComponent, isProxy, nextTick } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useSimulationState } from './useSimulationState.ts';

const SlotComponent = defineComponent({ template: '<div />' });

type Frame = { step: number };

const definition = (frameCount = 3) => ({
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

    expect(simulation.current.value?.frames).toHaveLength(3);

    simulation.current.value?.playhead.next();
    expect(simulation.current.value?.playhead.position).toBe(1);

    simulation.invalidate();
    expect(simulation.current.value?.frames).toHaveLength(3);
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
