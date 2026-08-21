import { getClientCoordinates } from '@core/utils/canvas/index';

import { isPointInBoundingBox } from '../helpers.ts';
import type { BoundingBox } from '../types/utility.ts';
import { clearActiveTextArea, setActiveTextArea } from './activeTextArea.ts';
import type { PlacedTextArea } from './defaults.ts';
import { getTextDimensions } from './getTextDimensions.ts';
import { HORIZONTAL_TEXT_PADDING } from './text.ts';
import type { OnTextAreaBlur } from './types.ts';

export const createTextarea = (
  ctx: CanvasRenderingContext2D,
  onTextAreaBlur: OnTextAreaBlur,
  textArea: PlacedTextArea,
) => {
  const { id, at, textBlock, activeColor: bgColor } = textArea;

  const { width, descent } = getTextDimensions(textBlock);
  const { clientX, clientY, zoom } = getClientCoordinates(at, ctx);

  const { color: textColor, content, fontSize, fontWeight } = textBlock;

  const minWidth = fontSize * 2 * zoom;
  const horizontalPadding = HORIZONTAL_TEXT_PADDING * zoom;

  const inputWidth = Math.round(
    Math.max(width * zoom + horizontalPadding, minWidth),
  );
  const inputHeight = Math.round(fontSize * 2 * zoom);

  const input = document.createElement('textarea');

  input.style.position = 'absolute';
  input.style.left = `${clientX}px`;
  input.style.top = `${clientY}px`;
  input.style.width = `${inputWidth}px`;
  input.style.height = `${inputHeight}px`;
  input.style.zIndex = '1000';

  input.style.resize = 'none';

  input.style.overflow = 'hidden';
  input.style.border = 'none';

  input.style.padding = '0';
  input.style.margin = '0';

  input.style.paddingTop = `${Math.round(descent * zoom)}px`;

  input.style.fontSize = `${fontSize * zoom}px`;
  input.style.color = textColor;
  input.style.backgroundColor = bgColor;
  input.style.fontFamily = 'Arial';
  input.style.textAlign = 'center';
  input.style.fontWeight = fontWeight;
  input.style.outline = 'none';
  input.style.boxSizing = 'border-box';

  // no text wrapping
  input.style.whiteSpace = 'nowrap';

  input.value = content;

  const adjustSize = () => {
    const currentWidth = parseFloat(input.style.width);

    // scrollWidth never reports less than the width already set, so collapse before measuring
    input.style.width = '0px';
    const contentWidth = input.scrollWidth;

    const newWidth = Math.round(
      Math.max(contentWidth + horizontalPadding, minWidth),
    );

    const deltaWidth = newWidth - currentWidth;
    input.style.left = `${parseFloat(input.style.left) - deltaWidth / 2}px`;

    input.style.width = `${newWidth}px`;
  };

  input.oninput = adjustSize;

  const removeInput = () => {
    input.onblur = null;
    clearActiveTextArea(id);
    onTextAreaBlur(input.value);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('wheel', removeInput);

    setTimeout(() => {
      // setTimeout to allow canvas time to update
      input.remove();
    }, 50);
  };

  input.onblur = removeInput;

  input.onkeydown = (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') {
      ev.preventDefault();
      removeInput();
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    const { x, y, width, height } = input.getBoundingClientRect();

    const boundingBox: BoundingBox = {
      at: { x, y },
      width,
      height,
    };

    const { clientX, clientY } = event;
    const clickedInside = isPointInBoundingBox(boundingBox, {
      x: clientX,
      y: clientY,
    });

    if (!clickedInside) removeInput();
  };

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('wheel', removeInput, { passive: true });

  setActiveTextArea({ canvas: ctx.canvas, textAreaId: id });

  document.body.appendChild(input);
  setTimeout(() => {
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, 5);
};
