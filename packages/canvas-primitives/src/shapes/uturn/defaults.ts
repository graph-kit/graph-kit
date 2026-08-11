import { resolveDefaults } from '../../defaults/resolveDefaults.ts';
import {
  LINE_WIDTH_DEFAULTS,
  ROTATION_DEFAULTS,
} from '../../defaults/schema.ts';
import type { UTurnSchema } from './types.ts';

export const UTURN_SCHEMA_DEFAULTS = {
  ...ROTATION_DEFAULTS,
  ...LINE_WIDTH_DEFAULTS,
} as const satisfies Partial<UTurnSchema>;

type UTurnDefaults = typeof UTURN_SCHEMA_DEFAULTS;

export const resolveUTurnDefaults = resolveDefaults<UTurnSchema, UTurnDefaults>(
  UTURN_SCHEMA_DEFAULTS,
);
export type UTurnSchemaWithDefaults = ReturnType<typeof resolveUTurnDefaults>;
