import type { AnchorPoint } from '../types/schema.ts';

/**
 * all font weights supported by html canvas
 */
export type FontWeight = 'lighter' | 'normal' | 'bold' | 'bolder';

/**
 * the text content for {@link TextArea}
 */
export type TextBlock = {
  content: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  color?: string;
  fontFamily?: string;
};

/**
 * a box that wraps some text without an {@link AnchorPoint}
 */
export type TextArea = {
  /**
   * the text areas inner text
   */
  textBlock: TextBlock;
  /**
   * the matte painted behind the text. omit it to paint no matte, leaving
   * whatever is already on the canvas showing behind the text. `'none'` goes
   * further and punches the text area out of the shape itself
   */
  color?: string;
  /**
   * the color of the text area when it is engaged
   * IE is converted to a textarea html element for user interaction
   */
  activeColor?: string;
};

export type TextAreaWithAnchorPoint = TextArea & AnchorPoint;

export type OnTextAreaBlur = (textContent: string) => void;

/**
 * Starts a text area editing session on the provided 2D canvas.
 *
 * A text area will be created and focused, allowing the user to input text.
 * When the text area loses focus (typically when the user clicks away or presses escape),
 * the provided callback will be invoked with the final text content.
 */
export type StartTextAreaEdit = (
  /**
   * Rendering context for the canvas the text area is on.
   */
  ctx: CanvasRenderingContext2D,

  /**
   * Callback invoked when the text area loses focus.
   * Receives the final text content entered by the user.
   */
  onTextAreaBlur: OnTextAreaBlur,
) => void;
