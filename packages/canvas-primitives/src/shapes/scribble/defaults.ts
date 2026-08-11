import { resolveDefaults } from '../../defaults/resolveDefaults.ts';
import type { ScribbleSchema } from './types.ts';

export const SCRIBBLE_SCHEMA_DEFAULTS = {
  brushWeight: 3,
} as const satisfies Partial<ScribbleSchema>;

type ScribbleDefaults = typeof SCRIBBLE_SCHEMA_DEFAULTS;

export const resolveScribbleDefaults = resolveDefaults<
  ScribbleSchema,
  ScribbleDefaults
>(SCRIBBLE_SCHEMA_DEFAULTS);
export type ScribbleSchemaWithDefaults = ReturnType<
  typeof resolveScribbleDefaults
>;
