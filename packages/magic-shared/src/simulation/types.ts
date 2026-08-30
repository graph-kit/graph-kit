import { ComputedRef } from 'vue';

import { Explainer } from '../explainer/types.ts';
import { Lens } from '../lens/types.ts';
import { GuardCheck, Violation } from './guard/SimulationGuardBuilder.ts';

export type FrameCollector<Frame> = {
  add: (frame: Frame) => void;
};

export type SetupContext<Frame> = {
  stopSimulation: () => void;
  currentFrame: ComputedRef<Frame>;
  getFrame: (position: number) => Frame;
  /** `Infinity` for simulations declared with `frameAt`. */
  frameCount: ComputedRef<number>;
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

/** Must return a frame for every number from 0 to infinity. */
export type FrameGeneratorFn<Frame> = (playheadPosition: number) => Frame;

type FrameSourceDefinition<Frame> =
  | { collectFrames: FrameCollectorFn<Frame>; frameAt?: never }
  | { frameAt: FrameGeneratorFn<Frame>; collectFrames?: never };

export type SimulationDefinition<Frame> = {
  /**
   * Runs before frames are (re)computed on every graph structure
   * change. When `guard()` returns a violation, the simulation
   * halts and swaps in the violation's lens in place of the running
   * simulation's lens, until a later structure change makes every check pass.
   */
  guard?: GuardCheck;

  setup: (context: SetupContext<Frame>) => SimulationEffects<Frame> | undefined;

  recomputeFramesOnStructureChange?: boolean;
} & FrameSourceDefinition<Frame>;
