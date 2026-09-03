import { ProductId } from '../product/manifests/index.ts';

/** every event the shell reports, and its payload */
export type TelemetryEventMap = {
  'product.opened': undefined;
  'product.closed': { durationMs: number };
  'simulation.started': { simulationId: string };
  'simulation.ended': { simulationId: string };
  'lens-chip.pinned': { lensId: string };
  'link.shared': undefined;
};

export type TelemetryEvent = keyof TelemetryEventMap;

export type TelemetryArgs<Name extends TelemetryEvent> =
  TelemetryEventMap[Name] extends undefined
    ? []
    : [payload: TelemetryEventMap[Name]];

/** an event on its way out, stamped with the product ID */
export type TelemetryEnvelope = {
  name: TelemetryEvent;
  productId: ProductId;
  /** absent for the events that carry nothing */
  payload?: Record<string, unknown>;
};
