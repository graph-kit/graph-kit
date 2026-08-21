import type { DeepReadonly } from 'ts-essentials';

import { rect } from '../shapes/rect/index.ts';
import type { ShapeTextProps } from '../types/index.ts';
import type { Coordinate } from '../types/utility.ts';
import { isTextAreaActive } from './activeTextArea.ts';
import { createTextarea } from './createTextarea.ts';
import type { PlacedTextArea, TextAreaWithDefaults } from './defaults.ts';
import { drawWithNoMatte } from './drawWithNoMatte.ts';
import { getTextDimensions } from './getTextDimensions.ts';
import type { StartTextAreaEdit, TextBlock } from './types.ts';

export const HORIZONTAL_TEXT_PADDING = 20;

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/**
 * Returned by {@link getShapeTextProps}. Extends {@link ShapeTextProps} with an
 * optional `drawOverride` that replaces the shape factory's default draw function
 * when the text area color is `'none'`. Shape factories should use this
 * instead of their own draw when it is defined.
 */
export type ShapeTextPropsResult = ShapeTextProps & {
  drawOverride?: DrawFn;
};

export const getShapeTextProps = (
  at?: Coordinate,
  textArea?: TextAreaWithDefaults,
  drawShape?: DrawFn,
): ShapeTextPropsResult | undefined => {
  if (!at || !textArea) return;

  const dimensions = getTextAreaDimension(textArea.textBlock);

  const placedTextArea = {
    ...textArea,
    at: {
      x: at.x - dimensions.width / 2,
      y: at.y - dimensions.height / 2,
    },
  } as const satisfies PlacedTextArea;

  const isNoMatte = placedTextArea.color === 'none';

  const textAreaMatte = rect({
    at: placedTextArea.at,
    width: dimensions.width,
    height: dimensions.height,
    fillColor: isNoMatte ? undefined : placedTextArea.color,
  });

  const drawCommittedText = drawTextWithTextArea(placedTextArea, dimensions);

  // an engaged text area is painted by the html input sitting over it, whose
  // content and width are both ahead of what the shape was built from
  const drawText = (ctx: CanvasRenderingContext2D) => {
    if (isTextAreaActive(ctx, placedTextArea.id)) return;
    drawCommittedText(ctx);
  };

  const drawTextArea = (ctx: CanvasRenderingContext2D) => {
    textAreaMatte.draw(ctx);
    drawText(ctx);
  };

  const startTextAreaEdit: StartTextAreaEdit = (ctx, onTextAreaBlur) => {
    createTextarea(ctx, onTextAreaBlur, placedTextArea);
  };

  const drawOverride =
    isNoMatte && drawShape
      ? (ctx: CanvasRenderingContext2D) =>
          drawWithNoMatte(ctx, drawShape, placedTextArea, dimensions, drawText)
      : undefined;

  const drawTextAreaHole = isNoMatte
    ? (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = 'black';
        ctx.fillRect(
          placedTextArea.at.x,
          placedTextArea.at.y,
          dimensions.width,
          dimensions.height,
        );
      }
    : undefined;

  return {
    textHitbox: textAreaMatte.hitbox,
    drawTextAreaMatte: textAreaMatte.draw,
    drawTextAreaHole,
    drawText,
    drawTextArea,
    startTextAreaEdit,
    drawOverride,
  };
};

type TextAreaDimensions = {
  width: number;
  height: number;
  ascent: number;
  descent: number;
};

export const getTextAreaDimension = (
  text: Required<TextBlock>,
): TextAreaDimensions => {
  const paddingVertical = HORIZONTAL_TEXT_PADDING;

  const { width, height, ascent, descent } = getTextDimensions(text);

  return {
    width: Math.max(
      width + HORIZONTAL_TEXT_PADDING,
      text.fontSize * 2, // default is square background
    ),
    height: Math.max(
      height + paddingVertical,
      text.fontSize * 2, // will need to be extended if text wrap
    ),
    ascent,
    descent,
  };
};

export const drawTextWithTextArea =
  (
    textArea: PlacedTextArea,
    textAreaDimensions: DeepReadonly<TextAreaDimensions>,
  ) =>
  (ctx: CanvasRenderingContext2D) => {
    const { at, textBlock } = textArea;
    const { content, fontSize, fontWeight, color, fontFamily } = textBlock;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { width, descent, height } = textAreaDimensions;

    ctx.fillText(content, at.x + width / 2, at.y + height / 2 + descent / 4);
  };
