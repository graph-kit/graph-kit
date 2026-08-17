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
   * adds the link sharing button to the central menu
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

export const resolveProductFlags = (
  flags: ProductFlagOptions = {},
): ProductFlags => {
  // an explicit undefined means no opinion, same as omitting the flag
  const set = Object.entries(flags).filter(([, value]) => value !== undefined);
  return { ...DEFAULTS, ...Object.fromEntries(set) };
};
