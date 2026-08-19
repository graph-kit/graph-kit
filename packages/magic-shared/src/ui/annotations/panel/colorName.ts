import colors from '@core/utils/colors';
import type { Color } from '@core/utils/colors';

const nameByHex = new Map(
  Object.entries(colors).map(([name, hex]) => [hex.toLowerCase(), name]),
);

const titleCase = (word: string) => word[0] + word.slice(1).toLowerCase();

/** "Red 600" for a color out of the palette, the hex itself for one picked by hand */
export const colorName = (color: Color) => {
  const name = nameByHex.get(color.toLowerCase());
  if (!name) return color.toUpperCase();
  return name.split('_').map(titleCase).join(' ');
};
