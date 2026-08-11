import { resolveDefaults } from '../../defaults/resolveDefaults.ts';
import type { TriangleSchema } from './types.ts';

export const TRIANGLE_SCHEMA_DEFAULTS =
  {} as const satisfies Partial<TriangleSchema>;

type TriangleDefaults = typeof TRIANGLE_SCHEMA_DEFAULTS;

export const resolveTriangleDefaults = resolveDefaults<
  TriangleSchema,
  TriangleDefaults
>(TRIANGLE_SCHEMA_DEFAULTS);
export type TriangleSchemaWithDefaults = ReturnType<
  typeof resolveTriangleDefaults
>;
