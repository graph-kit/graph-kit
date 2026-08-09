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

export type HighlightGroup = {
  sections: CircleLabel[][];
  color: string;
};
