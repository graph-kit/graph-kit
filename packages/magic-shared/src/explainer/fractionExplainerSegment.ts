import { fractionDecimalHint } from '@core/utils/math';
import Fraction from 'fraction.js';

import { ExplainerSegment } from './explainerSegments.ts';

/**
 * builds the segment for an `<angled>` fraction in explainer content, hovering
 * to reveal its decimal approximation
 *
 * @param raw the fraction, optionally suffixed with `:precision`
 * @example fractionExplainerSegment('1/3') // hovers to reveal '~0.333'
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
    // integers approximate to themselves, so they stay plain text with nothing to hover
    highlight: decimal
      ? {
          tooltipLabel: decimal,
          // a fraction is part of the sentence, not a control, so every button
          // background the explainer's default styling paints has to be undone
          classes:
            'px-0 bg-transparent hover:bg-transparent active:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent',
        }
      : undefined,
  };
};
