import type {
  AnchorPoint,
  TextArea as TextAreaSchema,
} from '../types/schema.ts';
import type { TextArea, TextBlock } from './types.ts';

export const TEXTAREA_DEFAULTS = {
  activeColor: 'white',
} as const satisfies Omit<TextArea, 'textBlock'>;

export const TEXT_BLOCK_DEFAULTS = {
  fontSize: 12,
  fontWeight: 'normal',
  color: 'black',
  fontFamily: 'Arial',
} as const satisfies Omit<TextBlock, 'content'>;

/**
 * a {@link TextArea} with every optional filled in, except `color`, whose
 * absence is itself the instruction to paint no matte
 */
export type TextAreaWithDefaults = {
  textBlock: Required<TextBlock>;
  color?: TextArea['color'];
  activeColor: string;
};

/** a {@link TextAreaWithDefaults} that has been placed on the canvas */
export type PlacedTextArea = TextAreaWithDefaults & AnchorPoint;

const getTextAreaWithDefaults = (textArea: TextArea): TextAreaWithDefaults => ({
  textBlock: {
    ...TEXT_BLOCK_DEFAULTS,
    ...textArea.textBlock,
  },
  color: textArea.color,
  activeColor: textArea.activeColor ?? TEXTAREA_DEFAULTS.activeColor,
});

export const resolveTextArea = (ta: TextAreaSchema['textArea']) =>
  ta && {
    textArea: getTextAreaWithDefaults(ta),
  };
