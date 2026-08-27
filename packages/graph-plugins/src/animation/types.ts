import { GraphPlugin, WithEvents } from '@graph/plugins-shared/plugins';

import { SurfacePlugin } from '../surface/types.ts';
import { AnimationEventMap } from './events.ts';

export type CaptureOptions = {
  /**
   * how long this capture's animations play for, in ms. applies to this capture
   * only, leaving the duration everything else animates at untouched
   *
   * @default the duration set via `setDuration`
   */
  durationMs?: number;
  /** ids this capture leaves alone. node movement is owned by the position layer and never needs listing */
  ignore?: Iterable<string>;
};

type BaseAnimationControls = {
  /**
   * opens a capture window and returns the `finalize` that closes it. prefer
   * `capture` unless the window has to span an await
   */
  auto: (options?: CaptureOptions) => () => void;
  /**
   * animates whatever `mutate` changes, closing the capture window even if it throws
   */
  capture: <MutationResult>(
    mutate: () => MutationResult,
    options?: CaptureOptions,
  ) => MutationResult;
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
