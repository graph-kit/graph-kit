import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App, createApp, defineComponent, h } from 'vue';

import { TelemetryEnvelope } from './events.ts';
import {
  setTelemetrySink,
  useProductVisit,
  useTelemetry,
} from './useTelemetry.ts';

let reported: TelemetryEnvelope[] = [];

// each visit listens on the document, so one left mounted reports into the next test
const mounted: App[] = [];

const names = () => reported.map((envelope) => envelope.name);

const mountVisit = () => {
  const app = createApp(
    defineComponent({
      setup: () => {
        useProductVisit(useTelemetry('sets'));
        return () => h('div');
      },
    }),
  );
  app.mount(document.createElement('div'));
  mounted.push(app);
  return app;
};

const setVisibility = (state: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  reported = [];
  setTelemetrySink((envelope) => reported.push(envelope));
});

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount();
  setVisibility('visible');
});

describe('useProductVisit', () => {
  it('reports the product it opened on', () => {
    mountVisit();

    expect(reported).toEqual([
      { name: 'product.opened', productId: 'sets', payload: undefined },
    ]);
  });

  it('closes the visit with a duration when the tab goes hidden', () => {
    mountVisit();
    setVisibility('hidden');

    expect(names()).toEqual(['product.opened', 'product.closed']);
    expect(reported[1].payload?.durationMs).toBeTypeOf('number');
  });

  it('closes the visit on unmount when the tab never hid', () => {
    mountVisit().unmount();

    expect(names()).toEqual(['product.opened', 'product.closed']);
  });

  it('reports a visit once, even when it ends twice over', () => {
    const app = mountVisit();
    setVisibility('hidden');
    setVisibility('visible');
    setVisibility('hidden');
    app.unmount();

    expect(names()).toEqual(['product.opened', 'product.closed']);
  });
});
