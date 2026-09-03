import { ReadonlyEventHub, createEventHub } from '@core/events/createEventHub';
import { assert, nullThrows } from '@core/utils/assert';
import { delta } from '@core/utils/delta/index';

import { ComputedRef, computed, ref, shallowRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { LensControls } from '../lens/useLensState.ts';
import StopSimulationButton from './StopSimulationButton.vue';
import { SimulationEventMap, createSimulationEventRegistry } from './events.ts';
import { Violation } from './guard/SimulationGuardBuilder.ts';
import SimulationScrubber from './scrubber/SimulationScrubber.vue';
import {
  SetupContext,
  SimulationDefinition,
  SimulationEffects,
} from './types.ts';

export type SimulationControls = {
  /** Runs a simulation. Throws if one is already active or if its guard is already failing. */
  start: <Frame>(definition: SimulationDefinition<Frame>) => void;
  /** Tears down the running simulation. Throws if nothing is running. */
  stop: () => void;
  /** The running simulation; `undefined` when nothing is running. */
  current: ComputedRef<Simulation<any> | undefined>;
  /** Reports that the underlying data changed, letting the simulation recheck its guard and recompute frames. */
  invalidate: () => void;
  /** Simulation events to passively listen for start, end, etc */
  events: ReadonlyEventHub<SimulationEventMap>;
};

type Playhead = {
  /** Index of the current frame in `frames`. */
  position: number;
  /** True when `position` is the last valid index; check before calling `next`. */
  isLast: () => boolean;
  /** True when `position` is the first valid index; check before calling `prev`. */
  isFirst: () => boolean;
  /** Moves to the previous frame. Throws if `isFirst()` is true. */
  prev: () => void;
  /** Moves to the next frame. Throws if `isLast()` is true. */
  next: () => void;
  /** Jumps to an arbitrary frame. Throws if out of bounds. */
  seek: (position: number) => void;
};

export type Simulation<Frame> = {
  definition: SimulationDefinition<Frame>;
  getFrame: (position: number) => Frame;
  /** `Infinity` for simulations declared with `frameAt`. */
  frameCount: number;
  playhead: Playhead;
  /** Set while the simulation's guard is failing; `undefined` when valid. */
  violation: Violation | undefined;
} & SimulationEffects<Frame>;

const COMPONENT_IDS = {
  scrubber: 'simulation/scrubber',
  stop: 'simulation/stop',
};

export const useSimulationState = (
  componentSlotControls: ComponentSlotControls,
  lensControls: LensControls,
): SimulationControls => {
  // shallow cus sims carry lenses which carry vue component definitions
  const simulation = shallowRef<Simulation<any>>();

  const events = createEventHub(createSimulationEventRegistry());

  const getSimulation = () =>
    nullThrows(simulation.value, 'no running simulation!');

  const patchSimulation = (fields: Partial<Simulation<any>>) => {
    simulation.value = { ...getSimulation(), ...fields };
  };

  const getFrame = (position: number) => getSimulation().getFrame(position);
  const frameCount = computed(() => getSimulation().frameCount);

  const currentFrame = computed(() => {
    const sim = simulation.value;
    if (!sim) return;
    return getFrame(sim.playhead.position);
  });

  const initFrameSource = <Frame>(definition: SimulationDefinition<Frame>) => {
    if (definition.frameAt) {
      const { frameAt } = definition;
      // surface a broken generator at start() rather than on some later step
      nullThrows(frameAt(0), 'simulation must produce a frame at position 0!');
      return {
        getFrame: (position: number) =>
          nullThrows(frameAt(position), `no frame at position ${position}`),
        frameCount: Infinity,
      };
    }

    const frames: Frame[] = [];
    definition.collectFrames({
      add: (frame) => frames.push(frame),
    });
    nullThrows(
      frames.at(0),
      'simulation must produce at least one frame to be valid!',
    );
    return {
      getFrame: (position: number) =>
        nullThrows(frames[position], `no frame at position ${position}`),
      frameCount: frames.length,
    };
  };

  const initPlayhead = (frameCount: number, previousPosition = 0): Playhead => {
    const position = ref(Math.min(previousPosition, frameCount - 1));
    const isFirst = () => position.value === 0;
    const isLast = () => position.value === frameCount - 1;

    const updatePosition = (newPosition: number) => {
      if (position.value === newPosition) return;
      const oldPosition = position.value;
      position.value = newPosition;

      const sim = getSimulation();
      sim.onFrameTransition?.(getFrame(newPosition), getFrame(oldPosition));
    };

    return {
      get position() {
        return position.value;
      },
      set position(_) {
        throw new Error(
          'Cannot set position directly. Use: prev, next, or seek methods',
        );
      },
      isFirst,
      isLast,
      next: () => {
        if (isLast()) {
          throw new Error(
            `playhead.next() called at last frame (${position.value} of ${frameCount - 1})`,
          );
        }
        updatePosition(position.value + 1);
      },
      prev: () => {
        if (isFirst()) {
          throw new Error(`playhead.prev() called at first frame (position 0)`);
        }
        updatePosition(position.value - 1);
      },
      seek: (value: number) => {
        if (value < 0 || value >= frameCount) {
          throw new Error(
            `playhead.seek(${value}) out of range [0, ${frameCount - 1}]`,
          );
        }
        updatePosition(value);
      },
    };
  };

  const computeRun = <Frame>(
    definition: SimulationDefinition<Frame>,
    previousPosition = 0,
  ) => {
    const source = initFrameSource(definition);
    const playhead = initPlayhead(source.frameCount, previousPosition);
    return { ...source, playhead };
  };

  const start = <Frame>(definition: SimulationDefinition<Frame>) => {
    assert(
      !simulation.value,
      'cannot start simulation: a simulation is already active!',
    );

    const violation = definition.guard?.();
    assert(
      !violation,
      `cannot start simulation: guard is already failing (${violation?.id})`,
    );

    const run = computeRun(definition);

    const setupContext: SetupContext<Frame> = {
      stopSimulation: stop,
      currentFrame,
      getFrame,
      frameCount,
    };
    const simulationEffects = definition.setup(setupContext);

    simulation.value = {
      ...run,
      definition,
      violation: undefined,
      ...simulationEffects,
    };

    componentSlotControls.addMany([
      {
        id: COMPONENT_IDS.scrubber,
        component: SimulationScrubber,
        position: 'bottom-middle',
        priority: 1,
      },
      {
        id: COMPONENT_IDS.stop,
        component: StopSimulationButton,
        position: 'top-right',
      },
    ]);

    if (simulation.value.lens) {
      lensControls.add(simulation.value.lens);
    }

    simulation.value.onSetupCompleted?.(setupContext.currentFrame.value);
    events.emit('onSimulationStarted', definition.id);
  };

  const stop = () => {
    const sim = getSimulation();
    sim.onBeforeTeardown?.();
    // if running sim had an active violation lens, remove the lens
    if (sim.violation?.lens) lensControls.remove(sim.violation.lens.id);
    componentSlotControls.remove(COMPONENT_IDS.scrubber);
    componentSlotControls.remove(COMPONENT_IDS.stop);
    if (sim.lens) lensControls.remove(sim.lens.id);
    sim.onTeardownCompleted?.();
    simulation.value = undefined;
    events.emit('onSimulationEnded', sim.definition.id);
  };

  // reconciles sim.violation with a fresh guard check, swapping the
  // displayed lens as needed. returns the violation id before and after
  // the check, so the caller can tell whether the graph is still invalid
  // and whether it just entered a new violation.
  const syncViolation = (sim: Simulation<any>) => {
    const previousViolationId = sim.violation?.id;
    const violation = sim.definition.guard?.();
    if (violation) {
      // same violation as last check, nothing to swap
      const isNewViolation = violation.id !== previousViolationId;
      if (isNewViolation) {
        // swap out whatever lens was displayed for this one
        const previousViolationLens = sim.violation?.lens;
        if (previousViolationLens)
          lensControls.remove(previousViolationLens.id);
        if (violation.lens) lensControls.add(violation.lens);
      }
      patchSimulation({ violation });
      return { previousViolationId, currentViolationId: violation.id };
    }

    // no violation this time, but there was a violation before.
    // moving from violation state -> no violation state
    const previousViolation = sim.violation;
    if (previousViolation) {
      if (previousViolation.lens) {
        lensControls.remove(previousViolation.lens.id);
      }
      patchSimulation({ violation: undefined });
    }
    return { previousViolationId, currentViolationId: undefined };
  };

  const recompute = () => {
    const sim = simulation.value;
    if (!sim) return;

    const shouldRecompute = sim.definition.recomputeFramesOnStructureChange;
    if (shouldRecompute === false) return;

    const { previousViolationId, currentViolationId } = syncViolation(sim);
    // graph is invalid, don't recompute frames against it
    if (currentViolationId) {
      if (currentViolationId !== previousViolationId) {
        const violated = getSimulation();
        violated.onViolation?.(
          nullThrows(violated.violation, 'violation missing'),
        );
      }
      return;
    }

    const run = computeRun(sim.definition, sim.playhead.position);

    const oldFrame = currentFrame.value;

    patchSimulation(run);

    const newFrame = currentFrame.value;

    const diff = delta(oldFrame, newFrame);
    if (diff !== null) sim.onFrameTransition?.(newFrame, oldFrame);
  };

  return {
    start,
    stop,
    current: computed(() => simulation.value),
    invalidate: recompute,
    events,
  };
};
