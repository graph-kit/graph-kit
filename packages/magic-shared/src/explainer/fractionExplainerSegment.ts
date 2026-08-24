import Fraction from 'fraction.js';

import { ExplainerSegment } from './explainerSegments.ts';
import { fractionDecimalHint } from './fractionDecimalHint.ts';

/**
 * builds the segment for an `<angled>` fraction in explainer content, hovering
 * to reveal its decimal approximation rounded to at most 3 decimal places
 *
 * @param raw the fraction, written either as `numerator/denominator` or as a
 * decimal (so an interpolated `${3.5}` or `${new Fraction(3.5)}` both work)
 * @example fractionExplainerSegment('1/3') // hovers to reveal '~0.333'
 * fractionExplainerSegment('3.5') // '7/2', hovers to reveal '3.5'
 * fractionExplainerSegment('4/2') // plain '2', nothing to reveal
 */
export const fractionExplainerSegment = (raw: string): ExplainerSegment => {
  const fraction = new Fraction(raw);
  const decimal = fractionDecimalHint(fraction);

  return {
    id: crypto.randomUUID(),
    text: fraction.toFraction(),
    highlight: decimal
      ? {
          tooltipLabel: decimal,
        }
      : undefined,
  };
};
