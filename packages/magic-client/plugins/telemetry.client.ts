import {
  type TelemetryEnvelope,
  setTelemetrySink,
} from '@magic/shared/telemetry';

export default defineNuxtPlugin(() => {
  const { posthogKey, posthogHost } = useRuntimeConfig().public;
  if (!posthogKey) return;

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
      api_host: posthogHost,
      // eventually move it over to localStorage or auth based to track retention data
      persistence: 'memory',
      autocapture: false,
      disable_session_recording: true,
      capture_pageview: false,
    });

    send = ({ name, productId, payload }) => {
      posthog.capture(
        name,
        { productId, ...payload },
        // a visit ends on a page the browser may already be tearing down
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
