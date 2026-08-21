import { getTargetCanvas } from '../offscreen.ts';
import type { TextAreaId } from './types.ts';

type ActiveTextArea = {
  canvas: HTMLCanvasElement;
  textAreaId: TextAreaId;
};

// one focused element per document means one active text area per document
let activeTextArea: ActiveTextArea | undefined;

export const setActiveTextArea = (textArea: ActiveTextArea) => {
  activeTextArea = textArea;
};

export const clearActiveTextArea = (textAreaId: TextAreaId) => {
  if (activeTextArea?.textAreaId !== textAreaId) return;
  activeTextArea = undefined;
};

export const isTextAreaActive = (
  ctx: CanvasRenderingContext2D,
  textAreaId: TextAreaId,
) =>
  activeTextArea?.textAreaId === textAreaId &&
  activeTextArea.canvas === getTargetCanvas(ctx.canvas);
