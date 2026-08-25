import { ShapeName } from '../../types/index.ts';
import type { Timeline } from '../timeline/define.ts';
import { LooseSchema } from '../types.ts';

export type LooseSchemaWithName = LooseSchema & { shapeName: ShapeName };

/**
 * a timeline auto animate plays. duration is left off because every auto
 * animate runs at the duration set on the instance when it plays
 */
export type AutoAnimateTimeline<TShape extends ShapeName> = Omit<
  Timeline<TShape>,
  'durationMs'
>;
