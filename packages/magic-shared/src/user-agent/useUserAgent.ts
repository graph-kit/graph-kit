import {
  useDevicePixelRatio,
  useOnline,
  usePreferredReducedMotion,
  useWindowSize,
} from '@vueuse/core';

import { ComputedRef, computed } from 'vue';

import { ParsedUserAgent, UNKNOWN, parseUserAgent } from './parseUserAgent.ts';

export type UserAgentControls = {
  /** what the string owns up to, best effort, see {@link parseUserAgent} */
  parsed: ParsedUserAgent;
  /** the string itself, empty where there is no navigator to ask */
  raw: string;
  language: string;
  timezone: string;
  /** zero on hardware with no touch input */
  touchPoints: number;
  /** logical cores, absent where the browser does not say */
  cores?: number;
  /** gigabytes of memory, chromium only */
  deviceMemoryGb?: number;
  /** the display the page opened on, absent with no screen to measure */
  screen?: { width: number; height: number };
  /** the viewport, which follows a resize */
  window: { width: ComputedRef<number>; height: ComputedRef<number> };
  pixelRatio: ComputedRef<number>;
  isOnline: ComputedRef<boolean>;
  prefersReducedMotion: ComputedRef<boolean>;
};

/**
 * What the browser says about itself, read once and handed around through the shell so a
 * debug panel, a bug report and a telemetry event all quote the same reading rather than
 * each asking navigator their own way.
 *
 * Everything the page cannot change is a plain value; only what moves under it, a resize
 * or the network dropping, is reactive.
 */
export const useUserAgent = (): UserAgentControls => {
  const client = typeof navigator === 'undefined' ? undefined : navigator;
  const display = typeof screen === 'undefined' ? undefined : screen;

  const raw = client?.userAgent ?? '';

  const { width, height } = useWindowSize();
  const { pixelRatio } = useDevicePixelRatio();
  const isOnline = useOnline();
  const reducedMotion = usePreferredReducedMotion();

  return {
    parsed: parseUserAgent(raw),
    raw,
    language: client?.language || UNKNOWN,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || UNKNOWN,
    touchPoints: client?.maxTouchPoints ?? 0,
    cores: client?.hardwareConcurrency,
    deviceMemoryGb: (client as { deviceMemory?: number } | undefined)
      ?.deviceMemory,
    screen: display
      ? { width: display.width, height: display.height }
      : undefined,
    window: {
      width: computed(() => width.value),
      height: computed(() => height.value),
    },
    pixelRatio: computed(() => pixelRatio.value),
    isOnline: computed(() => isOnline.value),
    prefersReducedMotion: computed(() => reducedMotion.value === 'reduce'),
  };
};
