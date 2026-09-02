<script setup lang="ts">
  import {
    useDevicePixelRatio,
    useOnline,
    usePreferredReducedMotion,
    useWindowSize,
  } from '@vueuse/core';

  import { computed } from 'vue';

  import DebugPanel from './shared/DebugPanel.vue';
  import DebugRow from './shared/DebugRow.vue';
  import DebugSection from './shared/DebugSection.vue';
  import DebugStatus from './shared/DebugStatus.vue';
  import { LABEL, VALUE } from './shared/classes.ts';
  import { UNKNOWN, parseUserAgent } from './shared/parseUserAgent.ts';

  /*
    debug mode only ever mounts this in a browser, but every route here is prerendered
    and a bare navigator read at setup is the kind of thing that only breaks in the
    build. so the readings come off these rather than off the globals
  */
  const client = typeof navigator === 'undefined' ? undefined : navigator;
  const display = typeof screen === 'undefined' ? undefined : screen;

  const userAgent = client?.userAgent ?? '';
  const parsed = parseUserAgent(userAgent);

  /** chromium only, and absent from the dom typings, so it is asked for rather than read */
  const deviceMemoryGb = (client as { deviceMemory?: number } | undefined)
    ?.deviceMemory;

  const cores = client?.hardwareConcurrency;
  const language = client?.language || UNKNOWN;
  const touchPoints = client?.maxTouchPoints ?? 0;

  // resolvedOptions is the only thing that will say which zone the browser settled on
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || UNKNOWN;

  const { width, height } = useWindowSize();
  const { pixelRatio } = useDevicePixelRatio();
  const isOnline = useOnline();
  const reducedMotion = usePreferredReducedMotion();

  /** the one reading worth having before the panel is read: what to reproduce on */
  const badge = computed(() =>
    parsed.version === UNKNOWN
      ? parsed.browser
      : `${parsed.browser} ${parsed.version}`,
  );

  const screenSize = computed(() =>
    display ? `${display.width} × ${display.height}` : UNKNOWN,
  );
</script>

<template>
  <DebugPanel title="User Agent">
    <template #badge>
      <span :class="[VALUE, 'font-bold']">{{ badge }}</span>
    </template>

    <DebugSection title="Browser">
      <DebugRow label="browser">{{ parsed.browser }}</DebugRow>
      <DebugRow label="version">{{ parsed.version }}</DebugRow>
      <DebugRow label="engine">{{ parsed.engine }}</DebugRow>
    </DebugSection>

    <DebugSection title="System">
      <DebugRow
        label="os"
        :title="parsed.os"
      >
        {{ parsed.os }}
      </DebugRow>
      <DebugRow label="form">{{
        parsed.isMobile ? 'mobile' : 'desktop'
      }}</DebugRow>
      <DebugRow label="touch">
        <span v-if="touchPoints">{{ touchPoints }} points</span>
        <span
          v-else
          :class="LABEL"
        >
          none
        </span>
      </DebugRow>
      <DebugRow label="cores">
        <span v-if="cores">{{ cores }}</span>
        <span
          v-else
          :class="LABEL"
        >
          {{ UNKNOWN }}
        </span>
      </DebugRow>
      <DebugRow label="memory">
        <span v-if="deviceMemoryGb">{{ deviceMemoryGb }} GB</span>
        <span
          v-else
          :class="LABEL"
        >
          {{ UNKNOWN }}
        </span>
      </DebugRow>
    </DebugSection>

    <DebugSection title="Display">
      <DebugRow label="window">
        {{ width }} &times; {{ height }}
        <span :class="LABEL">@{{ pixelRatio.toFixed(1) }}&times;</span>
      </DebugRow>
      <DebugRow label="screen">{{ screenSize }}</DebugRow>
    </DebugSection>

    <DebugSection title="Locale">
      <DebugRow label="language">{{ language }}</DebugRow>
      <DebugRow
        label="timezone"
        :title="timezone"
      >
        {{ timezone }}
      </DebugRow>
    </DebugSection>

    <DebugSection title="State">
      <DebugStatus
        label="online"
        :is-on="isOnline"
      />
      <DebugStatus
        label="reduced motion"
        :is-on="reducedMotion === 'reduce'"
      />
    </DebugSection>

    <!--
      the parse above is a best effort over a string full of compatibility lies, so the
      string itself is printed under it in full. it is the one readout here that has to
      survive being read back off a screenshot, which is why it wraps rather than
      truncating, and why a click takes all of it for pasting into the bug report
    -->
    <DebugSection title="Raw">
      <span :class="[VALUE, 'cursor-text select-all break-all']">
        {{ userAgent || UNKNOWN }}
      </span>
    </DebugSection>
  </DebugPanel>
</template>
