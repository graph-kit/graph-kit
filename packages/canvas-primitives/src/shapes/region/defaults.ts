import type { RegionSchema } from './types.ts';

export const REGION_SCHEMA_DEFAULTS = {
  inside: [],
  outside: [],
} as const satisfies Partial<RegionSchema>;

/*
  the shared `resolveDefaults` folds in a text area, and a region has no anchor
  point to hang one from. filling in the two lists is the whole job here
*/
export const resolveRegionDefaults = (schema: RegionSchema) => ({
  ...REGION_SCHEMA_DEFAULTS,
  ...schema,
  inside: schema.inside ?? REGION_SCHEMA_DEFAULTS.inside,
  outside: schema.outside ?? REGION_SCHEMA_DEFAULTS.outside,
});

export type RegionSchemaWithDefaults = ReturnType<typeof resolveRegionDefaults>;
