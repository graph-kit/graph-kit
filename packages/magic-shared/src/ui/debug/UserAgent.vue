<script setup lang="ts">
  import { useProvidedShell } from '../../product/context.ts';
  import { UNKNOWN } from '../../user-agent/parseUserAgent.ts';
  import DebugPanelMenu from './shared/DebugPanelMenu.vue';
  import DebugRow from './shared/DebugRow.vue';
  import DebugSection from './shared/DebugSection.vue';
  import DebugStatus from './shared/DebugStatus.vue';
  import { LABEL, VALUE } from './shared/classes.ts';

  const { userAgent } = useProvidedShell();

  const {
    parsed,
    raw,
    language,
    touchPoints,
    cores,
    deviceMemoryGb,
    pixelRatio,
    isOnline,
    prefersReducedMotion,
  } = userAgent;

  const { width, height } = userAgent.window;

  const badge =
    parsed.version === UNKNOWN
      ? parsed.browser
      : `${parsed.browser} ${parsed.version}`;

  const screenSize = userAgent.screen
    ? `${userAgent.screen.width} × ${userAgent.screen.height}`
    : UNKNOWN;
</script>

<template>
  <DebugPanelMenu title="User Agent">
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
      <!-- <DebugRow
        label="timezone"
        :title="userAgent.timezone"
      >
        {{ userAgent.timezone }}
      </DebugRow> -->
    </DebugSection>

    <DebugSection title="State">
      <DebugStatus
        label="online"
        :is-on="isOnline"
      />
      <DebugStatus
        label="reduced motion"
        :is-on="prefersReducedMotion"
      />
    </DebugSection>

    <DebugSection title="Raw">
      <span :class="[VALUE, 'cursor-text select-all break-all']">
        {{ raw || UNKNOWN }}
      </span>
    </DebugSection>
  </DebugPanelMenu>
</template>
