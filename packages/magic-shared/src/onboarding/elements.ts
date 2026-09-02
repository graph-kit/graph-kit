import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { image } from '@canvas/primitives/shapes/image/index';
import { rect } from '@canvas/primitives/shapes/rect/index';
import { BoundingBox } from '@core/utils/canvas/index';

import {
  CARD_BORDER_RADIUS,
  CARD_BORDER_WIDTH,
  LABEL_FONT,
  ONBOARDING_ELEMENT_ID_PREFIX,
  ONBOARDING_PRIORITY,
  THUMBNAIL_BORDER_RADIUS,
} from './constants.ts';
import { OnboardingLayout } from './layout.ts';
import { OnboardingFont, OnboardingItem, OnboardingPalette } from './types.ts';

// the aggregator paints in priority order, each tier landing over the one before it
const CARD_PRIORITY = ONBOARDING_PRIORITY;
const TILE_PRIORITY = ONBOARDING_PRIORITY + 1;
const CONTENT_PRIORITY = ONBOARDING_PRIORITY + 2;

const id = (suffix: string) => `${ONBOARDING_ELEMENT_ID_PREFIX}/${suffix}`;

const textElement = (
  elementId: string,
  box: BoundingBox,
  font: OnboardingFont,
  content: string,
  color: string,
): CanvasElement => ({
  id: elementId,
  paintOnly: true,
  priority: CONTENT_PRIORITY,
  // the box is sized to the text, so centering lands it on the layout's origin
  shape: rect({
    at: box.at,
    width: box.width,
    height: box.height,
    textArea: {
      id: elementId,
      textBlock: { ...font, content, color },
    },
  }),
});

export const onboardingElements = (
  items: OnboardingItem[],
  layout: OnboardingLayout,
  palette: OnboardingPalette,
): CanvasElement[] => {
  const elements: CanvasElement[] = [
    {
      id: id('card'),
      paintOnly: true,
      priority: CARD_PRIORITY,
      shape: rect({
        at: layout.card.at,
        width: layout.card.width,
        height: layout.card.height,
        fillColor: palette.cardColor,
        borderRadius: CARD_BORDER_RADIUS,
        stroke: {
          color: palette.borderColor,
          lineWidth: CARD_BORDER_WIDTH,
        },
      }),
    },
  ];

  for (const [index, item] of items.entries()) {
    const row = layout.rows[index];
    if (!row) continue;

    elements.push({
      id: id(`tile/${index}`),
      paintOnly: true,
      priority: TILE_PRIORITY,
      shape: rect({
        at: row.thumbnail.at,
        width: row.thumbnail.width,
        height: row.thumbnail.height,
        fillColor: palette.thumbnailColor,
        borderRadius: THUMBNAIL_BORDER_RADIUS,
      }),
    });

    elements.push({
      id: id(`image/${index}`),
      paintOnly: true,
      priority: CONTENT_PRIORITY,
      shape: image({
        at: row.image.at,
        width: row.image.width,
        height: row.image.height,
        src: item.imageUrl,
      }),
    });

    elements.push(
      textElement(
        id(`label/${index}`),
        row.label,
        LABEL_FONT,
        item.display,
        palette.labelColor,
      ),
    );
  }

  return elements;
};
