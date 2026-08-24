import { displayNumber } from '@core/utils/math';

import { ExplainerSegment } from './explainerSegments.ts';
import { unparsedExplainerSegment } from './unparsedExplainerSegment.ts';

/**
 * builds the segment for an `<angled>` number in explainer content, hovering to
 * reveal its decimal approximation rounded to at most 3 decimal places
 *
 * @param raw the number, written either as `numerator/denominator`, as a
 * decimal (so an interpolated `${3.5}` or `${new Fraction(3.5)}` both work), or
 * as infinity
 * @example numberExplainerSegment('1/3') // hovers to reveal '~0.333'
 * numberExplainerSegment('3.5') // '7/2', hovers to reveal '3.5'
 * numberExplainerSegment('4/2') // plain '2', nothing to reveal
 * numberExplainerSegment('∞') // '∞', the symbol speaks for itself
 * numberExplainerSegment('half') // red '?', hovers to say it cannot be read
 */
export const numberExplainerSegment = (raw: string): ExplainerSegment => {
  const { primary, secondary, error } = displayNumber(raw);

  if (error) {
    console.error(`explainer: cannot parse "${raw}" as a number`);
    return unparsedExplainerSegment(error);
  }

  return {
    id: crypto.randomUUID(),
    text: primary,
    highlight: secondary
      ? {
          tooltipLabel: secondary,
        }
      : undefined,
  };
};
