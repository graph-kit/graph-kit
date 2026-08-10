import { Coordinate } from '@core/utils/canvas/index';

// the name a set is referred to by in a query, unique across defined sets
export type SetLabel = string;

export type SetDefinitionId = string;

// what the rendering layer turns into a circle
export type SetDisplay = {
  at: Coordinate;
  radius: number;
};

export type SetDefinition = {
  id: SetDefinitionId;
  label: SetLabel;
  display: SetDisplay;
};

/**
 * one atomic region of the set space, as the ids of the sets containing it.
 * ids are shown as their labels below for readability
 *
 * @example
 * ['B'] // the part of B that no other set covers
 * ['A', 'B'] // where A and B intersect, and nothing else does
 * ['A', 'B', 'C'] // where all three intersect
 * [OUTSIDE_ALL_SETS.identity] // outside every set, see {@link OUTSIDE_ALL_SETS}
 */
export type Section = SetDefinitionId[];

// unparsed set notation latex, parsed into a HighlightGroup to color the sections it matches
export type HighlightQuery = string;

export type HighlightQueryId = string;

export type HighlightGroup = {
  sections: Section[];
  color: string;
};
