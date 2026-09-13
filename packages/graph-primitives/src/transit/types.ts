type Serializable<T> = T extends { toJSON(): infer R }
  ? R
  : T extends RegExp | Date | ((...args: never[]) => unknown)
    ? never // These break or change form during native stringify
    : T extends object
      ? { [K in keyof T]: Serializable<T[K]> }
      : T;

export type TransitControls<PayloadData> = {
  /** convert plugin state into a JSON serializable payload */
  encode: () => Serializable<PayloadData>;
  /** write the payload data into state */
  decode: (data: PayloadData) => void;
  /** inspect and certify that the shape of the data is valid before it is decoded */
  validate: (data: unknown) => boolean;
};

/**
 * the graph wide transit surface, assembled by the orchestrator out of every
 * participating plugin's {@link TransitControls} and keyed by plugin name.
 * validation lives on the per plugin controls, so it runs inside `decode` here.
 */
export type GraphTransit<PayloadData> = {
  encode: () => PayloadData;
  decode: (data: PayloadData) => void;
};

/**
 * the graph wide transit surface as seen by a plugin, which cannot know the full
 * plugin list it will be folded alongside.
 */
export type LooseGraphTransit = GraphTransit<Record<string, unknown>>;
