import type { Coordinate } from '@core/utils/canvas/index';

import type { RectSchema } from '../shapes/rect/types.ts';

export type { Coordinate };

export type BoundingBox = Pick<RectSchema, 'at' | 'width' | 'height'>;

export type BoundingBoxCorners = {
  topLeft: Coordinate;
  bottomRight: Coordinate;
};

export type GradientStop = {
  /**
   * between [0, 1) denoting the color of shape at that point
   * (ei color: green offset: 0.5 makes shape green at midpoint)
   */
  offset: number;
  /**
   * parsed by the tinycolor library
   */
  color: string;
};

/**
 * for defining dashed borders
 */
export type DashPattern = readonly [dashLength: number, gapLength: number];

export type Stroke = {
  color: string;
  lineWidth: number;
  dash?:
    | DashPattern
    | {
        /**
         * [dashLength: number, gapLength: number]
         */
        pattern: DashPattern;
        offset?: number;
      };
};

export type BorderRadiusArrayValue = [
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number,
];
