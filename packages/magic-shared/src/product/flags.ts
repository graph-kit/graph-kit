import type { ProductControls } from './types.ts';

/** every optional behavior a product can switch on or off */
export type ShellFlags = {
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
   * adds the animation speed submenu to the "more options" menu
   * @default false
   */
  adjustAnimationSpeed: boolean;
  /**
   * offers a way back when the camera is left somewhere its content is not
   * @default true
   */
  jumpToContent: boolean;
  /**
   * suggests what to try first when the product opens on nothing
   * @default true
   */
  onboarding: boolean;
};

const DEFAULTS: ShellFlags = {
  history: true,
  localStorage: true,
  annotations: true,
  linkSharing: true,
  adjustAnimationSpeed: false,
  jumpToContent: true,
  onboarding: true,
};

/** what a product author writes: only what differs from {@link ShellFlags} defaults */
export type ShellFlagOptions = Partial<ShellFlags>;

/** nothing to persist or put in a link without {@link ProductControls.transit} */
const TRANSIT_BACKED = [
  'localStorage',
  'linkSharing',
] as const satisfies readonly (keyof ShellFlags)[];

/** what the product asked for, narrowed to what its controls can actually support */
export const resolveShellFlags = (
  flags: ShellFlagOptions = {},
  product: Pick<ProductControls, 'transit' | 'isContent'>,
): ShellFlags => {
  // an explicit undefined means no opinion, same as omitting the flag
  const set = Object.entries(flags).filter(([, value]) => value !== undefined);
  const resolved: ShellFlags = { ...DEFAULTS, ...Object.fromEntries(set) };

  const withoutProductSupport = (flag: keyof ShellFlags, missing: string) => {
    if (flags[flag] && import.meta.env.DEV)
      console.warn(`[shell] ${flag} needs product ${missing}, ignoring`);
    resolved[flag] = false;
  };

  if (!product.transit)
    for (const flag of TRANSIT_BACKED) withoutProductSupport(flag, 'transit');

  if (!product.isContent) withoutProductSupport('jumpToContent', 'isContent');

  return resolved;
};
