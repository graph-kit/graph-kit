import { ThemePreset } from '../../graph/types.ts';

/** one image per theme, since artwork legible on light is rarely legible on dark */
export type Thumbnail = Record<ThemePreset, string>;

/** the product as it appears on a navigation card */
export type MagicProductCard = {
  name: string;
  description: string;
};

/** everything the navigation menu needs to list a product and route to it */
export type MagicProductNavigation = {
  /** path this product is served from, without the leading slash */
  slug: string;
  /** if missing, product card wont show up in the navigation menu */
  card?: MagicProductCard;
};

/** tags handed to `useSeoMeta` by the page hosting this product */
type MagicProductMeta = {
  title: string;
  description: string;
};

/**
 * all of a product experience except its view, so that navigation can describe
 * every product without importing any of them
 */
export type MagicProductManifest = {
  /** unique ID of the product experience */
  id: string;
  /** full product name, shown in the navigation menu trigger */
  name: string;
  /** short form of the name, for anywhere a full one cannot fit, like a graph node */
  abbreviatedName: string;
  navigation: MagicProductNavigation;
  meta: MagicProductMeta;
  /**
   * whether this product can take part in a room. required rather than defaulted so
   * every product declares it, since silently opting in is how a product ends up
   * syncing state it was never built to hand over.
   *
   * false means invisible to the multiplayer system entirely: no server state, not
   * movable to, never seeded, and no "start room" action.
   */
  multiplayer: boolean;
};
