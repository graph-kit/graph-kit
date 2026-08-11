import { getCtx, getDevicePixelRatio } from '@core/utils/canvas/index';
import { generateId } from '@core/utils/id';

import { defineComponent, h, onMounted, watch } from 'vue';

import { cross } from './shapes/cross/index.ts';
import type { CrossSchema } from './shapes/cross/types.ts';
import { rect } from './shapes/rect/index.ts';
import type { RectSchema } from './shapes/rect/types.ts';
import { square } from './shapes/square/index.ts';
import type { SquareSchema } from './shapes/square/types.ts';
import type { ShapeFactory } from './types/index.ts';
import type { AnchorPoint } from './types/schema.ts';
import type { BoundingBox, Coordinate } from './types/utility.ts';

const atMarkerSchema = (at: Coordinate): CrossSchema => ({
  at,
  size: 5,
  fillColor: 'red',
  lineWidth: 1,
});

const atMarker = (at: Coordinate) => cross(atMarkerSchema(at));

const centerMarkerSchema = (at: Coordinate): CrossSchema => ({
  at,
  size: 5,
  fillColor: 'purple',
  lineWidth: 1,
});

const centerMarker = (at: Coordinate) => cross(centerMarkerSchema(at));

const boundingBoxMarkerSchema = (bb: BoundingBox): RectSchema => ({
  at: bb.at,
  width: bb.width,
  height: bb.height,
  stroke: {
    color: 'green',
    lineWidth: 1,
  },
});

const boundingBoxMarker = (bb: BoundingBox) =>
  rect(boundingBoxMarkerSchema(bb));

const measuringStickSchema: SquareSchema = {
  at: { x: 0, y: 0 },
  size: 1008,
  stroke: {
    color: 'black',
    lineWidth: 4,
    dash: [10, 10],
  },
};

const measuringStick = square(measuringStickSchema);

export type DocMarkingOptions = {
  showAtMarker: boolean;
  showBoundingBoxMarker: boolean;
  showMeasuringStick: boolean;
  showCenterMarker: boolean;
};

export const DOC_MARKING_DEFAULTS: DocMarkingOptions = {
  showAtMarker: false,
  showBoundingBoxMarker: false,
  showMeasuringStick: false,
  showCenterMarker: false,
};

export const DEFAULT_STORIES = {
  basic: {},
  markings: {
    args: {
      showAtMarker: true,
      showBoundingBoxMarker: true,
      showMeasuringStick: true,
      showCenterMarker: false,
    },
  },
  text: {
    args: {
      textArea: {
        textBlock: {
          content: 'Hi!',
          color: 'white',
        },
        color: 'blue',
      },
    },
  },
  stroke: {
    args: {
      stroke: {
        color: 'blue',
        lineWidth: 10,
      },
    },
  },
  rotation: {
    args: {
      rotation: Math.PI * (1 / 4), // 45deg in radians
    },
  },
  colorGradient: {
    args: {
      fillGradient: [
        {
          color: 'red',
          offset: 0,
        },
        {
          color: 'red',
          offset: 0.95,
        },
        {
          color: 'blue',
          offset: 0.96,
        },
        {
          color: 'blue',
          offset: 1,
        },
      ],
    },
  },
} as const;

export const createDocComponent = <T extends Record<string, unknown>>(
  factory: ShapeFactory<T>,
): ReturnType<typeof defineComponent> =>
  defineComponent<T & DocMarkingOptions>({
    inheritAttrs: false,
    setup: (_, { attrs }) => {
      const props = attrs as T & DocMarkingOptions;
      const canvasId = generateId();

      const drawPreview = () => {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

        const ctx = getCtx(canvas);

        const dpr = getDevicePixelRatio();
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const {
          showAtMarker,
          showCenterMarker,
          showBoundingBoxMarker,
          showMeasuringStick,
        } = props;

        if (showMeasuringStick) measuringStick.draw(ctx);
        const shape = factory(props);
        shape.draw(ctx);
        if (showBoundingBoxMarker)
          boundingBoxMarker(shape.getBoundingBox()).draw(ctx);
        if (showAtMarker && 'at' in props)
          atMarker(props.at as AnchorPoint['at']).draw(ctx);
        if (showCenterMarker) centerMarker(shape.getCenterPoint()).draw(ctx);
      };

      onMounted(drawPreview);
      watch(() => ({ ...props }), drawPreview);

      return () =>
        h('canvas', {
          id: canvasId,
          width: 400,
          height: 400,
        });
    },
  });
