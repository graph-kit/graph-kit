import {
  DisplayNumberError,
  DisplayNumberErrorReason,
  displayNumber,
} from '@core/utils/math';

import { ExplainerSegment } from './explainerSegments.ts';
import { unparsedExplainerSegment } from './unparsedExplainerSegment.ts';

const UNREADABLE_LABELS: Record<
  DisplayNumberErrorReason,
  (raw: string) => string
> = {
  'divide-by-zero': (raw) => `Cannot Divide By Zero: ${raw}`,
  unparseable: (raw) => `Cannot Parse ${raw} As A Number`,
};

const unreadableLabel = ({ error, raw }: DisplayNumberError) =>
  UNREADABLE_LABELS[error](raw);

/**
 * builds the segment for an `<angled>` number in explainer content, hovering to
 * reveal its decimal approximation rounded to at most 3 decimal places
 *
 * @param rawDisplayNumber the number written as string, fraction, number, or +- infinity
 * @example numberExplainerSegment('1/3') // hovers to reveal '~0.333'
 * numberExplainerSegment('3.5') // '7/2', hovers to reveal '3.5'
 * numberExplainerSegment('∞') // '∞', no secondary
 * numberExplainerSegment('half') // red '?', hovers to say it cannot be read
 */
export const numberExplainerSegment = (
  rawDisplayNumber: string,
): ExplainerSegment => {
  const display = displayNumber(rawDisplayNumber);

  if ('error' in display) {
    console.error(`explainer: cannot parse "${rawDisplayNumber}" as a number`);
    return unparsedExplainerSegment(unreadableLabel(display));
  }

  const { primary, secondary } = display;

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
