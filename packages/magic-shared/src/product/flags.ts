import type { MagicProductHost } from './types.ts';

/** every optional behavior a product can switch on or off */
export type ProductFlags = {
  /**
   * tracks undo/redo over the product's state
   * @default true
   */
  history: boolean;
  /**
   * persists state to, and restores it from, local storage
   * @default true
   */
  localStorage: boolean;
  /**
   * lets the canvas be drawn on with the annotation tools
   * @default true
   */
  annotations: boolean;
  /**
   * adds the link sharing button to the "more options" menu
   * @default true
   */
  linkSharing: boolean;
  /**
   * shows dev mode debugging components
   * @default false
   */
  debug: boolean;
};

const DEFAULTS: ProductFlags = {
  history: true,
  localStorage: true,
  annotations: true,
  linkSharing: true,
  debug: false,
};

/** what a product author writes: only what differs from {@link ProductFlags} defaults */
export type ProductFlagOptions = Partial<ProductFlags>;

/** nothing to persist or put in a link without {@link MagicProductHost.transit} */
const TRANSIT_BACKED = [
  'localStorage',
  'linkSharing',
] as const satisfies readonly (keyof ProductFlags)[];

/** what the product asked for, narrowed to what its host can actually support */
export const resolveProductFlags = (
  flags: ProductFlagOptions = {},
  host: Pick<MagicProductHost, 'transit'>,
): ProductFlags => {
  // an explicit undefined means no opinion, same as omitting the flag
  const set = Object.entries(flags).filter(([, value]) => value !== undefined);
  const resolved: ProductFlags = { ...DEFAULTS, ...Object.fromEntries(set) };

  if (host.transit) return resolved;

  for (const flag of TRANSIT_BACKED) {
    if (flags[flag] && import.meta.env.DEV)
      console.warn(`[magic] ${flag} needs host transit, ignoring`);
    resolved[flag] = false;
  }

  return resolved;
};
