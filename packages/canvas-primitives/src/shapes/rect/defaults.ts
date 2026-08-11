import { resolveDefaults } from '../../defaults/resolveDefaults.ts';
import {
  BORDER_RADIUS_DEFAULTS,
  ROTATION_DEFAULTS,
} from '../../defaults/schema.ts';
import type { RectSchema } from './types.ts';

export const RECT_SCHEMA_DEFAULTS = {
  ...BORDER_RADIUS_DEFAULTS,
  ...ROTATION_DEFAULTS,
} as const satisfies Partial<RectSchema>;

type RectDefaults = typeof RECT_SCHEMA_DEFAULTS;

export const resolveRectDefaults = resolveDefaults<RectSchema, RectDefaults>(
  RECT_SCHEMA_DEFAULTS,
);
export type RectSchemaWithDefaults = ReturnType<typeof resolveRectDefaults>;
