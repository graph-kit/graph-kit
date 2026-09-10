import { ProductId } from '../../product/manifests/index.ts';

/** every shot is the same window at the same crop, so one size describes them all */
export const PREVIEW_WIDTH = 1200;
export const PREVIEW_HEIGHT = 578;

/** a wide shot of a product mid use, for showing the app off where it cannot run */
export type ProductPreview = {
  productId: ProductId;
  /** served from the client's public directory */
  src: string;
  /** what this particular shot is doing, which the product's own description does not say */
  caption: string;
};

export const productPreviews: ProductPreview[] = [
  {
    productId: 'set-theory',
    src: '/app-preview/set-theory.png',
    caption: 'Create queries, edit them to update the shading.',
  },
  {
    productId: 'path-finding',
    src: '/app-preview/path-finding.png',
    caption: 'Graph properties update in real-time.',
  },
  {
    productId: 'minimum-spanning-trees',
    src: '/app-preview/minimum-spanning-trees.png',
    caption: 'Hit buttons. Highlight properties. Build intuition.',
  },
];
