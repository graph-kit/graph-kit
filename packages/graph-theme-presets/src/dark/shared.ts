import { CURSOR } from '@core/utils/cursor';
import colors from '@core/utils/colors';

const sharedText = {
  content: '?',
  size: 24,
  color: colors.WHITE,
  fontWeight: 'bold',
} as const;

export const shared = {
  node: {
    size: 35,
    borderWidth: 8,
    cursor: CURSOR.POINTER,
    text: sharedText,
  },
  edge: {
    width: 10,
    text: sharedText,
    cursor: CURSOR.POINTER,
  },
  anchors: {
    radius: Math.ceil(Math.sqrt(35) * 2),
    cursor: CURSOR.GRAB,
    edgePreview: {
      color: colors.STONE_900,
      width: 10,
    },
  },
} as const;
