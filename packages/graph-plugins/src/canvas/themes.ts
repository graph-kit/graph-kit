import type { FontWeight } from '@canvas/primitives/text/types';
import { Coordinate } from '@canvas/surface/types';
import {
  CursorFallback,
  ThemeOverrides,
  ThemeValue,
  TokenResolver,
} from '@core/themes/index';
import { Color } from '@core/utils/colors';
import { Cursor } from '@core/utils/cursor';
import { ComputedTokenDetectorMap } from '@graph/computed-tokens/index';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { DeepReadonly } from 'ts-essentials';

import { GraphUnderCursor } from './types.ts';

type TextStyleValues = {
  text: string;
  textSize: number;
  textColor: Color;
  textFontWeight: FontWeight;
};

type NodeStyleValues = TextStyleValues & {
  size: number;
  borderWidth: number;
  borderColor: Color;
  color: Color;
  cursor: Cursor;
};

type EdgeStyleValues = TextStyleValues & {
  color: Color;
  width: number;
  cursor: Cursor;
};

export type NodeThemeValues = {
  [K in keyof NodeStyleValues]: ThemeValue<
    NodeStyleValues[K],
    [node: CoreNode]
  >;
};

export type EdgeThemeValues = {
  [K in keyof EdgeStyleValues]: ThemeValue<
    EdgeStyleValues[K],
    [edge: CoreEdge]
  >;
};

type CanvasThemeValues = {
  color: ThemeValue<string>;
  /*
    takes the alpha and nothing else. the pattern covers the viewport a few
    thousand cells at a time at low zoom, so this resolves once a frame and the
    result is reused for every cell. a coordinate argument would force it back
    to once a cell to mean anything
  */
  patternColor: ThemeValue<string, [alpha: string]>;
  cursor: ThemeValue<Cursor | CursorFallback>;
};

export type CanvasThemes = {
  'node.default.text.content': NodeThemeValues['text'];
  'node.default.text.size': NodeThemeValues['textSize'];
  'node.default.text.color': NodeThemeValues['textColor'];
  'node.default.text.fontWeight': NodeThemeValues['textFontWeight'];
  'node.default.size': NodeThemeValues['size'];
  'node.default.border.width': NodeThemeValues['borderWidth'];
  'node.default.border.color': NodeThemeValues['borderColor'];
  'node.default.color': NodeThemeValues['color'];
  'node.default.cursor': NodeThemeValues['cursor'];

  'node.hover.text.content': NodeThemeValues['text'];
  'node.hover.text.size': NodeThemeValues['textSize'];
  'node.hover.text.color': NodeThemeValues['textColor'];
  'node.hover.text.fontWeight': NodeThemeValues['textFontWeight'];
  'node.hover.size': NodeThemeValues['size'];
  'node.hover.border.width': NodeThemeValues['borderWidth'];
  'node.hover.border.color': NodeThemeValues['borderColor'];
  'node.hover.color': NodeThemeValues['color'];
  'node.hover.cursor': NodeThemeValues['cursor'];

  'edge.default.text.content': EdgeThemeValues['text'];
  'edge.default.text.size': EdgeThemeValues['textSize'];
  'edge.default.text.color': EdgeThemeValues['textColor'];
  'edge.default.text.fontWeight': EdgeThemeValues['textFontWeight'];
  'edge.default.color': EdgeThemeValues['color'];
  'edge.default.width': EdgeThemeValues['width'];
  'edge.default.cursor': EdgeThemeValues['cursor'];

  'edge.hover.text.content': EdgeThemeValues['text'];
  'edge.hover.text.size': EdgeThemeValues['textSize'];
  'edge.hover.text.color': EdgeThemeValues['textColor'];
  'edge.hover.text.fontWeight': EdgeThemeValues['textFontWeight'];
  'edge.hover.color': EdgeThemeValues['color'];
  'edge.hover.width': EdgeThemeValues['width'];
  'edge.hover.cursor': EdgeThemeValues['cursor'];

  'canvas.color': CanvasThemeValues['color'];
  'canvas.patternColor': CanvasThemeValues['patternColor'];
  'canvas.cursor': CanvasThemeValues['cursor'];
};

export const createCanvasDetectors = (
  resolveToken: TokenResolver<CanvasThemes>,
  graphUnderCursor: DeepReadonly<GraphUnderCursor>,
): ComputedTokenDetectorMap => {
  const hovered = (id: string) => graphUnderCursor.topElement?.id === id;
  return {
    hovered: {
      node: {
        'node.color': (node) =>
          hovered(node.id) ? resolveToken('node.hover.color', node) : undefined,
        'node.size': (node) =>
          hovered(node.id) ? resolveToken('node.hover.size', node) : undefined,
        'node.border.color': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.border.color', node)
            : undefined,
        'node.border.width': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.border.width', node)
            : undefined,
        'node.cursor': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.cursor', node)
            : undefined,
        'node.text.content': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.text.content', node)
            : undefined,
        'node.text.size': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.text.size', node)
            : undefined,
        'node.text.color': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.text.color', node)
            : undefined,
        'node.text.fontWeight': (node) =>
          hovered(node.id)
            ? resolveToken('node.hover.text.fontWeight', node)
            : undefined,
      },
      edge: {
        'edge.color': (edge) =>
          hovered(edge.id) ? resolveToken('edge.hover.color', edge) : undefined,
        'edge.width': (edge) =>
          hovered(edge.id) ? resolveToken('edge.hover.width', edge) : undefined,
        'edge.cursor': (edge) =>
          hovered(edge.id)
            ? resolveToken('edge.hover.cursor', edge)
            : undefined,
        'edge.text.content': (edge) =>
          hovered(edge.id)
            ? resolveToken('edge.hover.text.content', edge)
            : undefined,
        'edge.text.size': (edge) =>
          hovered(edge.id)
            ? resolveToken('edge.hover.text.size', edge)
            : undefined,
        'edge.text.color': (edge) =>
          hovered(edge.id)
            ? resolveToken('edge.hover.text.color', edge)
            : undefined,
        'edge.text.fontWeight': (edge) =>
          hovered(edge.id)
            ? resolveToken('edge.hover.text.fontWeight', edge)
            : undefined,
      },
    },
    default: {
      node: {
        'node.color': (node) => resolveToken('node.default.color', node),
        'node.size': (node) => resolveToken('node.default.size', node),
        'node.border.color': (node) =>
          resolveToken('node.default.border.color', node),
        'node.border.width': (node) =>
          resolveToken('node.default.border.width', node),
        'node.cursor': (node) => resolveToken('node.default.cursor', node),
        'node.text.content': (node) =>
          resolveToken('node.default.text.content', node),
        'node.text.size': (node) =>
          resolveToken('node.default.text.size', node),
        'node.text.color': (node) =>
          resolveToken('node.default.text.color', node),
        'node.text.fontWeight': (node) =>
          resolveToken('node.default.text.fontWeight', node),
      },
      edge: {
        'edge.color': (edge) => resolveToken('edge.default.color', edge),
        'edge.width': (edge) => resolveToken('edge.default.width', edge),
        'edge.cursor': (edge) => resolveToken('edge.default.cursor', edge),
        'edge.text.content': (edge) =>
          resolveToken('edge.default.text.content', edge),
        'edge.text.size': (edge) =>
          resolveToken('edge.default.text.size', edge),
        'edge.text.color': (edge) =>
          resolveToken('edge.default.text.color', edge),
        'edge.text.fontWeight': (edge) =>
          resolveToken('edge.default.text.fontWeight', edge),
      },
    },
  };
};

export const createCanvasThemeOverrides = (): ThemeOverrides<CanvasThemes> => ({
  'node.default.text.content': [],
  'node.default.text.size': [],
  'node.default.text.color': [],
  'node.default.text.fontWeight': [],
  'node.default.size': [],
  'node.default.border.width': [],
  'node.default.border.color': [],
  'node.default.color': [],
  'node.default.cursor': [],

  'node.hover.text.content': [],
  'node.hover.text.size': [],
  'node.hover.text.color': [],
  'node.hover.text.fontWeight': [],
  'node.hover.size': [],
  'node.hover.border.width': [],
  'node.hover.border.color': [],
  'node.hover.color': [],
  'node.hover.cursor': [],

  'edge.default.text.content': [],
  'edge.default.text.size': [],
  'edge.default.text.color': [],
  'edge.default.text.fontWeight': [],
  'edge.default.color': [],
  'edge.default.width': [],
  'edge.default.cursor': [],

  'edge.hover.text.content': [],
  'edge.hover.text.size': [],
  'edge.hover.text.color': [],
  'edge.hover.text.fontWeight': [],
  'edge.hover.color': [],
  'edge.hover.width': [],
  'edge.hover.cursor': [],

  'canvas.color': [],
  'canvas.patternColor': [],
  'canvas.cursor': [],
});
