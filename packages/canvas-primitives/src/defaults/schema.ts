import type { BorderRadius, LineWidth, Rotation } from '../types/schema.ts';

export const LINE_WIDTH_DEFAULTS = {
  lineWidth: 10,
} as const satisfies LineWidth;

export const ROTATION_DEFAULTS = {
  rotation: 0,
} as const satisfies Rotation;

export const BORDER_RADIUS_DEFAULTS = {
  borderRadius: 0,
} as const satisfies BorderRadius;
