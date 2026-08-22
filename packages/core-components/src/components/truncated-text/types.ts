import { type TooltipOptions } from '../tooltip/types.ts';

/** shared, because the wrapper in magic-shared forwards every one of these unchanged */
export interface TruncatedTextProps extends Omit<TooltipOptions, 'class'> {
  /**
   * what the tooltip says instead of the text itself, for when there is something to
   * add rather than something to finish reading. shown whether or not the text is cut
   * off, since the reason for saying it has nothing to do with the width
   */
  tooltip?: string;
}
