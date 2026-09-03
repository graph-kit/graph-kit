import { ProductId } from '../product/manifests/index.ts';

/**
 * every event the shell reports, and what it carries. `undefined` for the ones with nothing to add.
 * payloads name only what the app itself defines, never anything a user typed or drew
 */
export type TelemetryEventMap = {
  'product.opened': undefined;
  'product.closed': { durationMs: number };
  'simulation.started': { simulationId: string };
  'simulation.ended': { simulationId: string };
  'lens-chip.pinned': { lensId: string };
  'link.shared': undefined;
};

export type TelemetryEvent = keyof TelemetryEventMap;

/** the payload argument drops out entirely for events that carry nothing */
export type TelemetryArgs<Name extends TelemetryEvent> =
  TelemetryEventMap[Name] extends undefined
    ? []
    : [payload: TelemetryEventMap[Name]];

/** an event on its way out, stamped with the product that reported it */
export type TelemetryEnvelope = {
  name: TelemetryEvent;
  productId: ProductId;
  /** absent for the events that carry nothing */
  payload?: Record<string, unknown>;
};
