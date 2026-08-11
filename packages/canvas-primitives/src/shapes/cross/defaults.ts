import { resolveDefaults } from '../../defaults/resolveDefaults.ts';
import {
  BORDER_RADIUS_DEFAULTS,
  LINE_WIDTH_DEFAULTS,
  ROTATION_DEFAULTS,
} from '../../defaults/schema.ts';
import type { CrossSchema } from './types.ts';

export const CROSS_SCHEMA_DEFAULTS = {
  ...ROTATION_DEFAULTS,
  ...LINE_WIDTH_DEFAULTS,
  ...BORDER_RADIUS_DEFAULTS,
} as const satisfies Partial<CrossSchema>;

type CrossDefaults = typeof CROSS_SCHEMA_DEFAULTS;

export const resolveCrossDefaults = resolveDefaults<CrossSchema, CrossDefaults>(
  CROSS_SCHEMA_DEFAULTS,
);
export type CrossSchemaWithDefaults = ReturnType<typeof resolveCrossDefaults>;
