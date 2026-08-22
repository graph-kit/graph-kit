import { generateId } from '@core/utils/id';
import type { DeepReadonly, DeepRequired } from 'ts-essentials';

import type { SchemaWithDefaults } from '../../defaults/shapes.ts';
import { TextArea } from '../../text/types.ts';
import type { ShapeNameToSchema, WithId } from '../../types/index.ts';
import type { EasingOption } from '../easing.ts';
import { type CompiledTimeline, compileTimeline } from './compile.ts';

type ShapeTarget = {
  /**
   * the {@link WithId | id} of the shape to target
   */
  shapeId: string;
};

export type TimelineId = string;

type IdField = {
  timelineId: TimelineId;
};

type TimelinePlayOptions = ShapeTarget & {
  /**
   * number of times this animation should run
   *
   * 👉 NOTE 👈 if {@link Timeline.synchronize} is set to true, `runCount` will always be `Infinity`
   * @default Infinity
   */
  runCount?: number;
  /**
   * called the moment this animation naturally exhausts its `runCount` (the
   * same tick the animation system cleans it up internally). Not called if
   * the animation is interrupted early via `stop`.
   */
  onComplete?: () => void;
  /**
   * called the moment this animation stops playing for any reason: natural
   * completion, an explicit `stop`, or being displaced by another animation.
   * Prefer this over `onComplete` for cleanup that must always run.
   */
  onOver?: () => void;
};

export type UseDefineTimelineOptions = {
  play: (
    options: TimelinePlayOptions & IdField & Pick<Timeline<any>, 'synchronize'>,
  ) => void;
  pause: (options: ShapeTarget & IdField) => void;
  resume: (options: ShapeTarget & IdField) => void;
  stop: (options: ShapeTarget & IdField) => void;
};

type TimelineControls = {
  /**
   * start the animation
   */
  play: (options: TimelinePlayOptions) => void;
  /**
   * stop the animation until `resume` is invoked
   */
  pause: (options: ShapeTarget) => void;
  /**
   * starts animations that have been paused
   */
  resume: (options: ShapeTarget) => void;
  /**
   * stop and reset the animation
   */
  stop: (options: ShapeTarget) => void;
  /**
   * cleanup the timeline if no longer needed
   *
   * NOTE: important when making a large number of calls to `defineTimeline`
   * in order to reclaim memory
   */
  dispose: () => void;
};

type TextAreaCustomOption<TSchema> = (
  propValue: TextArea,
  schema: TSchema,
) => TextArea;

type CustomOption<TProp, TSchema> = (
  propValue: DeepRequired<TProp>,
  schema: TSchema,
) => TProp;

type WithCustomOption<TSchema> = {
  [TProp in keyof TSchema]: TProp extends 'textArea'
    ? TSchema[TProp] | TextAreaCustomOption<TSchema>
    : TSchema[TProp] | CustomOption<TSchema[TProp], TSchema>;
};

type WithObjectOption<TSchema> = {
  [TProp in keyof TSchema]:
    TSchema[TProp] | { value: TSchema[TProp]; easing?: EasingOption };
};

type TimelinePropsWithCustomOption<TSchema> = WithObjectOption<
  WithCustomOption<TSchema>
>;

/**
 * A manually-defined animation track for a single property.
 * Used as an escape hatch when the property is too complex for standard keyframe interpolation.
 */
export type ImperativeTrack<TSchema, TProp extends keyof TSchema> = {
  /**
   * A function that computes the property's value at a given progress point.
   *
   * @param progress A number from 0 to 1 representing animation progress.
   * @returns The computed value for the property at the given progress.
   */
  value: (progress: number, schema: TSchema) => TSchema[TProp];
  /**
   * Optional easing function to apply to the progress value before passing to `value`.
   * @default 'linear'
   */
  easing?: EasingOption;
};

type CustomInterpolation<TSchema> = {
  [TProp in keyof TSchema]: ImperativeTrack<TSchema, TProp>;
};

export type TimelineCustomInterpolations<TSchema> = {
  customInterpolations?: Partial<CustomInterpolation<TSchema>>;
};

type TimelineKeyframe<TSchema> = {
  progress: number;
  properties: Partial<TimelinePropsWithCustomOption<TSchema>>;
};

export type TimelinePlaybackDuration = {
  durationMs: number;
};

export type TimelinePlaybackDelay = {
  delayMs?: number;
};

export type Timeline<T extends keyof ShapeNameToSchema> = DeepReadonly<
  {
    forShapes: T[];
    keyframes?: TimelineKeyframe<SchemaWithDefaults[NoInfer<T>]>[];
    easing?: Partial<
      Record<keyof SchemaWithDefaults[NoInfer<T>], EasingOption>
    >;
    /**
     * allow shapes to animate in sync even when invoking {@link TimelineControls.play} at different times
     */
    synchronize?: boolean;
  } & TimelinePlaybackDuration &
    TimelinePlaybackDelay &
    TimelineCustomInterpolations<SchemaWithDefaults[NoInfer<T>]>
>;

export const createDefineTimeline = (controls: UseDefineTimelineOptions) => {
  const timelineIdToTimeline: Map<TimelineId, CompiledTimeline> = new Map();

  const defineTimeline = <T extends keyof ShapeNameToSchema>(
    timeline: Timeline<T>,
  ): TimelineControls => {
    const timelineId = generateId();

    const compiledTimeline = compileTimeline(timeline as Timeline<any>);
    timelineIdToTimeline.set(timelineId, compiledTimeline);

    return {
      play: (opts) =>
        controls.play({
          ...opts,
          timelineId,
          synchronize: timeline.synchronize,
        }),
      pause: (opts) => controls.pause({ ...opts, timelineId }),
      resume: (opts) => controls.resume({ ...opts, timelineId }),
      stop: (opts) => controls.stop({ ...opts, timelineId }),
      dispose: () => timelineIdToTimeline.delete(timelineId),
    };
  };

  return {
    timelineIdToTimeline,
    defineTimeline,
  };
};

export type DefineTimeline = ReturnType<
  typeof createDefineTimeline
>['defineTimeline'];
