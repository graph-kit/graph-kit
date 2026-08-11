import { resolveDefaults } from '../../defaults/resolveDefaults.ts';
import { ROTATION_DEFAULTS } from '../../defaults/schema.ts';
import type { StarSchema } from './types.ts';

export const STAR_SCHEMA_DEFAULTS = {
  ...ROTATION_DEFAULTS,
  points: 5,
} as const satisfies Partial<StarSchema>;

type StarDefaults = typeof STAR_SCHEMA_DEFAULTS;

export const resolveStarDefaults = resolveDefaults<StarSchema, StarDefaults>(
  STAR_SCHEMA_DEFAULTS,
);
export type StarSchemaWithDefaults = ReturnType<typeof resolveStarDefaults>;
