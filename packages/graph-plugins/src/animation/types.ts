import { GraphPlugin, WithEvents } from '@graph/plugins-shared/plugins';

import { SurfacePlugin } from '../surface/types.ts';
import { AnimationEventMap } from './events.ts';

type BaseAnimationControls = {
  /**
   * opens a capture window and returns the `finalize` that closes it. prefer
   * `capture` unless the window has to span an await
   */
  auto: () => () => void;
  /**
   * animates whatever `mutate` changes, closing the capture window even if it throws
   */
  capture: <MutationResult>(mutate: () => MutationResult) => MutationResult;
  /** how long an auto animated capture takes to play out, in ms */
  duration: () => number;
  /** sets how long an auto animated capture takes to play out. accepts a positive number */
  setDuration: (durationMs: number) => void;
};

export type AnimationControls = WithEvents<
  BaseAnimationControls,
  AnimationEventMap
>;

export type AnimationPlugin = GraphPlugin<{
  name: 'animation';
  dependsOn: [SurfacePlugin];
  controls: AnimationControls;
  events: AnimationEventMap;
}>;
