import { getTextDimensions } from '@canvas/primitives/text/getTextDimensions';
import { BoundingBox } from '@core/utils/canvas/index';

import {
  CARD_PADDING,
  LABEL_FONT,
  ROW_GAP,
  ROW_HEIGHT,
  THUMBNAIL_GAP,
  THUMBNAIL_PADDING,
  THUMBNAIL_SIZE,
} from './constants.ts';
import { OnboardingItem } from './types.ts';

export type OnboardingRowLayout = {
  /** the tile an item's image is framed by */
  thumbnail: BoundingBox;
  /** the image, inset in the tile rather than filling it */
  image: BoundingBox;
  /** the box the name is centered in, sized to the name so it reads left aligned */
  label: BoundingBox;
};

export type OnboardingLayout = {
  card: BoundingBox;
  rows: OnboardingRowLayout[];
};

/** the card, sized to its contents and centered on whatever the canvas is showing */
export const onboardingLayout = (
  items: OnboardingItem[],
  visibleWorldRect: BoundingBox,
): OnboardingLayout => {
  const labelSizes = items.map((item) =>
    getTextDimensions({ ...LABEL_FONT, content: item.display }),
  );

  const widestLabel = Math.max(0, ...labelSizes.map(({ width }) => width));
  const width = CARD_PADDING * 2 + THUMBNAIL_SIZE + THUMBNAIL_GAP + widestLabel;

  const height =
    CARD_PADDING * 2 +
    items.length * ROW_HEIGHT +
    Math.max(items.length - 1, 0) * ROW_GAP;

  const card: BoundingBox = {
    at: {
      x: visibleWorldRect.at.x + visibleWorldRect.width / 2 - width / 2,
      y: visibleWorldRect.at.y + visibleWorldRect.height / 2 - height / 2,
    },
    width,
    height,
  };

  const contentLeft = card.at.x + CARD_PADDING;
  const labelLeft = contentLeft + THUMBNAIL_SIZE + THUMBNAIL_GAP;

  const rows: OnboardingRowLayout[] = [];
  for (const [index, labelSize] of labelSizes.entries()) {
    const rowTop = card.at.y + CARD_PADDING + index * (ROW_HEIGHT + ROW_GAP);
    rows.push({
      thumbnail: {
        at: { x: contentLeft, y: rowTop },
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
      },
      image: {
        at: {
          x: contentLeft + THUMBNAIL_PADDING,
          y: rowTop + THUMBNAIL_PADDING,
        },
        width: THUMBNAIL_SIZE - THUMBNAIL_PADDING * 2,
        height: THUMBNAIL_SIZE - THUMBNAIL_PADDING * 2,
      },
      label: {
        at: {
          x: labelLeft,
          y: rowTop + ROW_HEIGHT / 2 - labelSize.height / 2,
        },
        width: labelSize.width,
        height: labelSize.height,
      },
    });
  }

  return { card, rows };
};
