import { Prettify } from 'ts-essentials';

import type { TextBlock } from './types.ts';

type TextDimensions = {
  width: number;
  height: number;
  ascent: number;
  descent: number;
};

/*
  measuring used to create a canvas element and a 2d context per call, and the
  call happens inside every shape factory, and every shape is rebuilt from
  scratch on every draw. that put the cost at one element and one context per
  labeled shape per frame, plus another full set on every mousemove, all to
  re-derive numbers that had not changed since the last time they were asked
  for.

  one canvas, made once. the dimensions stay at the 1x1 default: measureText
  reads nothing off the bitmap
*/
let measureCtx: CanvasRenderingContext2D | undefined;

const getMeasureCtx = () => {
  if (measureCtx) return measureCtx;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context not found on text measuring canvas');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  measureCtx = ctx;
  return measureCtx;
};

/*
  unbounded on purpose. the key space is the distinct labels actually on screen,
  which at the graph sizes this is built for is a few dozen strings, so eviction
  would cost more code than the memory it saves
*/
const cache = new Map<string, TextDimensions>();

type Text = Prettify<Required<Omit<TextBlock, 'color'>>>;

export const getTextDimensions = (text: Text) => {
  const { content, fontSize, fontWeight, fontFamily } = text;

  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const key = `${font}|${content}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const ctx = getMeasureCtx();
  ctx.font = font;
  const metrics = ctx.measureText(content);

  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;

  const dimensions: TextDimensions = {
    width: metrics.width,
    height: ascent + descent,
    ascent,
    descent,
  };

  cache.set(key, dimensions);

  return dimensions;
};
