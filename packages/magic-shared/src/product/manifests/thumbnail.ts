import { ThemePreset } from '../../graph/types.ts';

/** artwork legible on light is rarely legible on dark, so products ship one image per theme */
export const productThumbnail = (productId: string, preset: ThemePreset) =>
  `/product-thumbnails/${preset}/${productId}.webp`;
