import { IS_DEV } from '@core/utils/debugging';
import {
  type TelemetryEnvelope,
  setTelemetrySink,
} from '@magic/shared/telemetry';

export default defineNuxtPlugin(() => {
  const { posthogKey } = useRuntimeConfig().public;
  if (IS_DEV || !posthogKey) return;

  const router = useRouter();

  let send: ((envelope: TelemetryEnvelope) => void) | undefined;

  /** for events that occur before post-hog loads in */
  const waiting: TelemetryEnvelope[] = [];

  setTelemetrySink((envelope) => {
    if (send) return send(envelope);
    waiting.push(envelope);
  });

  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      // so client-side blocklists like chrome extensions cant kill user analytics
      api_host: 'https://oink.magicgraphs.app',
      ui_host: 'https://us.posthog.com',
      // navigation is a full page load, so identity has to outlive the document to stitch a session
      persistence: 'localStorage',
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
      // its default rides on capture_pageview, and a session reads as the pair
      capture_pageleave: true,
    });

    send = ({ name, productId, payload }) => {
      posthog.capture(
        name,
        { productId, ...payload },
        name === 'product.closed' ? { transport: 'sendBeacon' } : undefined,
      );
    };

    for (const envelope of waiting) send(envelope);
    waiting.length = 0;

    const pageview = (path: string) =>
      posthog.capture('$pageview', { $current_url: path });

    // afterEach only covers what follows, and the page opened on is the one that matters most
    pageview(router.currentRoute.value.fullPath);
    router.afterEach((to) => pageview(to.fullPath));
  });
});
