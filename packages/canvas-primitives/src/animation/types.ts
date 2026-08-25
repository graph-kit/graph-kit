import type { EverySchemaPropName, WithId } from '../types/index.ts';
import type { TimelineId } from './timeline/define.ts';

/**
 * the value of a {@link LooseSchema}
 */
export type LooseSchemaValue = any;

/**
 * a looser version of a shape schema (when fully type safe schemas become a nuisance)
 */
export type LooseSchema = WithId<
  Partial<Record<EverySchemaPropName, LooseSchemaValue>>
>;

export type ActiveAnimation = {
  /**
   * links the active animation to the animation definition
   */
  timelineId: TimelineId;
  /**
   * number of times this animation will run before automatically stopping (can be fractional).
   * set to `Infinity` to run animation indefinitely
   */
  runCount: number;

  /**
   * unix timestamp when the animation started
   */
  startedAt: number;

  /**
   * the schema at the point the animation started
   */
  schemaWithDefaults?: LooseSchema;

  /**
   * called the moment this animation exhausts its `runCount`.
   * Not called when the animation is interrupted early via `stop`.
   */
  onComplete?: () => void;

  /**
   * called the moment this animation stops playing for any reason
   */
  onOver?: () => void;
};
