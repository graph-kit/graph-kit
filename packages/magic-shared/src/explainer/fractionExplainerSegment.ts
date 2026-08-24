import Fraction from 'fraction.js';

import { ExplainerSegment } from './explainerSegments.ts';
import { fractionDecimalHint } from './fractionDecimalHint.ts';

/**
 * builds the segment for an `<angled>` fraction in explainer content, hovering
 * to reveal its decimal approximation
 *
 * @param raw the fraction, written either as `numerator/denominator` or as a
 * decimal (so an interpolated `${3.5}` or `${new Fraction(3.5)}` both work),
 * optionally suffixed with `:precision`
 * @example fractionExplainerSegment('1/3') // hovers to reveal '~0.333'
 * fractionExplainerSegment('3.5') // '7/2', hovers to reveal '3.5'
 * fractionExplainerSegment('1/3:1') // hovers to reveal '~0.3'
 * fractionExplainerSegment('4/2') // plain '2', nothing to reveal
 */
export const fractionExplainerSegment = (raw: string): ExplainerSegment => {
  const [value, precision] = raw.split(':');
  const fraction = new Fraction(value);
  const decimal = fractionDecimalHint(
    fraction,
    precision === undefined ? undefined : Number(precision),
  );

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
