import { Coordinate } from '@core/utils/canvas/index';

export type CircleLabel = string;

export type Circle = {
  at: Coordinate;
  label: CircleLabel;
  radius: number;
};

export type Overlap = {
  id: number;
  circles: Circle['label'][];
};

// unparsed set notation latex, parsed into a HighlightGroup to color the sections it matches
export type HighlightQuery = string;

export type HighlightQueryId = string;

export type HighlightGroup = {
  sections: CircleLabel[][];
  color: string;
};
