import { ThemeOverrides, TokenResolver } from '@core/themes/index';
import { ComputedTokenDetectorMap } from '@graph/computed-tokens/index';

import { EdgeThemeValues, NodeThemeValues } from '../surface/themes.ts';

export type FocusThemes = {
  'node.focus.text.content': NodeThemeValues['text'];
  'node.focus.text.size': NodeThemeValues['textSize'];
  'node.focus.text.color': NodeThemeValues['textColor'];
  'node.focus.text.fontWeight': NodeThemeValues['textFontWeight'];
  'node.focus.text.fontFamily': NodeThemeValues['textFontFamily'];
  'node.focus.size': NodeThemeValues['size'];
  'node.focus.border.width': NodeThemeValues['borderWidth'];
  'node.focus.border.color': NodeThemeValues['borderColor'];
  'node.focus.color': NodeThemeValues['color'];
  'node.focus.cursor': NodeThemeValues['cursor'];
  'edge.focus.text.content': EdgeThemeValues['text'];
  'edge.focus.text.size': EdgeThemeValues['textSize'];
  'edge.focus.text.color': EdgeThemeValues['textColor'];
  'edge.focus.text.fontWeight': EdgeThemeValues['textFontWeight'];
  'edge.focus.text.fontFamily': EdgeThemeValues['textFontFamily'];
  'edge.focus.color': EdgeThemeValues['color'];
  'edge.focus.width': EdgeThemeValues['width'];
  'edge.focus.cursor': EdgeThemeValues['cursor'];
};

export const createFocusDetectors = (
  isFocused: (id: string) => boolean,
  resolveToken: TokenResolver<FocusThemes>,
): ComputedTokenDetectorMap => ({
  focus: {
    node: {
      'node.color': (node) =>
        isFocused(node.id) ? resolveToken('node.focus.color', node) : undefined,
      'node.size': (node) =>
        isFocused(node.id) ? resolveToken('node.focus.size', node) : undefined,
      'node.border.color': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.border.color', node)
          : undefined,
      'node.border.width': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.border.width', node)
          : undefined,
      'node.cursor': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.cursor', node)
          : undefined,
      'node.text.content': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.text.content', node)
          : undefined,
      'node.text.size': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.text.size', node)
          : undefined,
      'node.text.color': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.text.color', node)
          : undefined,
      'node.text.fontWeight': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.text.fontWeight', node)
          : undefined,
      'node.text.fontFamily': (node) =>
        isFocused(node.id)
          ? resolveToken('node.focus.text.fontFamily', node)
          : undefined,
    },
    edge: {
      'edge.color': (edge) =>
        isFocused(edge.id) ? resolveToken('edge.focus.color', edge) : undefined,
      'edge.width': (edge) =>
        isFocused(edge.id) ? resolveToken('edge.focus.width', edge) : undefined,
      'edge.cursor': (edge) =>
        isFocused(edge.id)
          ? resolveToken('edge.focus.cursor', edge)
          : undefined,
      'edge.text.content': (edge) =>
        isFocused(edge.id)
          ? resolveToken('edge.focus.text.content', edge)
          : undefined,
      'edge.text.size': (edge) =>
        isFocused(edge.id)
          ? resolveToken('edge.focus.text.size', edge)
          : undefined,
      'edge.text.color': (edge) =>
        isFocused(edge.id)
          ? resolveToken('edge.focus.text.color', edge)
          : undefined,
      'edge.text.fontWeight': (edge) =>
        isFocused(edge.id)
          ? resolveToken('edge.focus.text.fontWeight', edge)
          : undefined,
      'edge.text.fontFamily': (edge) =>
        isFocused(edge.id)
          ? resolveToken('edge.focus.text.fontFamily', edge)
          : undefined,
    },
  },
});

export const createFocusThemeOverrides = (): ThemeOverrides<FocusThemes> => ({
  'node.focus.text.content': [],
  'node.focus.text.size': [],
  'node.focus.text.color': [],
  'node.focus.text.fontWeight': [],
  'node.focus.text.fontFamily': [],
  'node.focus.size': [],
  'node.focus.border.width': [],
  'node.focus.border.color': [],
  'node.focus.color': [],
  'node.focus.cursor': [],
  'edge.focus.text.content': [],
  'edge.focus.text.size': [],
  'edge.focus.text.color': [],
  'edge.focus.text.fontWeight': [],
  'edge.focus.text.fontFamily': [],
  'edge.focus.color': [],
  'edge.focus.width': [],
  'edge.focus.cursor': [],
});
