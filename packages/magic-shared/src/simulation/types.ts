import { ComputedRef } from 'vue';

import { Explainer } from '../explainer/types.ts';
import { Lens } from '../lens/types.ts';
import { GuardCheck, Violation } from './guard/SimulationGuardBuilder.ts';

export type FrameCollector<Frame> = {
  add: (frame: Frame) => void;
};

export type SetupContext<Frame> = {
  stopSimulation: () => void;
  frames: ComputedRef<Frame[]>;
  currentFrame: ComputedRef<Frame>;
};

export type SimulationLifecycle<Frame> = {
  onSetupCompleted?: (firstFrame: Frame) => void;
  onBeforeTeardown?: () => void;
  onTeardownCompleted?: () => void;
  onFrameTransition?: (newFrame: Frame, oldFrame: Frame) => void;
  onViolation?: (violation: Violation) => void;
};

export type SimulationEffects<Frame> = {
  lens?: Lens;
  explainer?: (frame: Frame) => Explainer | undefined;
} & SimulationLifecycle<Frame>;

export type FrameCollectorFn<Frame> = (
  collector: FrameCollector<Frame>,
) => void;

export type SimulationDefinition<Frame> = {
  /**
   * Runs before frames are (re)computed on every graph structure
   * change. When `guard()` returns a violation, the simulation
   * halts and swaps in the violation's lens in place of the running
   * simulation's lens, until a later structure change makes every check pass.
   */
  guard?: GuardCheck;

  collectFrames: FrameCollectorFn<Frame>;
  setup: (context: SetupContext<Frame>) => SimulationEffects<Frame> | undefined;

  // TODO add mutations (add, remove, move etc) that may occur at a given step, not just structure change
  recomputeFramesOnStructureChange?: boolean;

  /** user facing name of the simulation */
  name: string;
};
