import { onMounted, onUnmounted } from 'vue';

import { ProductId } from '../product/manifests/index.ts';
import { TelemetryArgs, TelemetryEnvelope, TelemetryEvent } from './events.ts';

export type TelemetrySink = (envelope: TelemetryEnvelope) => void;

let sink: TelemetrySink | undefined;

/**
 * gives the shell somewhere to send what it reports. the client registers the real sink on
 * boot, so until then, and in any build without an analytics key, events go nowhere
 */
export const setTelemetrySink = (destination: TelemetrySink) => {
  sink = destination;
};

export type TelemetryControls = {
  track: <Name extends TelemetryEvent>(
    name: Name,
    ...args: TelemetryArgs<Name>
  ) => void;
};

export const useTelemetry = (productId: ProductId): TelemetryControls => ({
  track: (name, ...args) => {
    sink?.({ name, productId, payload: args[0] });
  },
});

/** reports when the user arrives and leaves the product. */
export const useProductVisit = (telemetry: TelemetryControls) => {
  let openedAt: number | undefined;

  const close = () => {
    if (openedAt === undefined) return;
    const durationMs = Math.round(performance.now() - openedAt);
    openedAt = undefined;
    telemetry.track('product.closed', { durationMs });
  };

  const closeWhenHidden = () => {
    if (document.visibilityState === 'hidden') close();
  };

  onMounted(() => {
    openedAt = performance.now();
    telemetry.track('product.opened');
    document.addEventListener('visibilitychange', closeWhenHidden);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', closeWhenHidden);
    close();
  });
};
