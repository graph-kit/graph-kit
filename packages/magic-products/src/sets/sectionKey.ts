import type { Section } from './types.ts';

export type SectionKey = string;

// a section is identified by the sets covering it, so a stable order makes them comparable
export const getSectionKey = (section: Section): SectionKey =>
  section.toSorted((a, b) => a.localeCompare(b)).join('.');
