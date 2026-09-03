import {
  type TelemetryEnvelope,
  setTelemetrySink,
} from '@magic/shared/telemetry';

export default defineNuxtPlugin(() => {
  const { posthogKey, posthogHost } = useRuntimeConfig().public;
  if (!posthogKey) return;

  const router = useRouter();

  /*
    posthog is fetched rather than bundled into the entry, so it costs nothing on a build
    without a key and never blocks hydration on one with it. that leaves a window where the
    shell is already reporting, so the sink goes up now and what arrives early waits here
  */
  let send: ((envelope: TelemetryEnvelope) => void) | undefined;
  const waiting: TelemetryEnvelope[] = [];

  setTelemetrySink((envelope) => {
    if (send) return send(envelope);
    waiting.push(envelope);
  });

  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // there are no accounts to tie events to, so nothing here is worth a cookie
      persistence: 'memory',
      respect_dnt: true,
      /*
        the products are a canvas over panels of user typed labels, so anything automatic
        would be both noise and content we have no business collecting
      */
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
