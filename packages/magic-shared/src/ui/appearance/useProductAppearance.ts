import {
  BasicColorMode,
  BasicColorSchema,
  useMounted,
  usePreferredDark,
} from '@vueuse/core';
import { useCookie, useHead } from 'nuxt/app';

import { computed, onMounted, watch } from 'vue';

import {
  APPEARANCE_COOKIE_KEY,
  APPEARANCE_COOKIE_OPTIONS,
  APPEARANCE_PREPAINT_SCRIPT,
  DEFAULT_APPEARANCE,
  appearances,
} from './appearances.ts';

/** what prerendering bakes into the markup, since no cookie or media query reaches it */
const PRERENDERED_APPEARANCE: BasicColorMode = 'light';

const validAppearance = (appearance: unknown): appearance is BasicColorSchema =>
  appearances.some((candidate) => candidate === appearance);

const resolve = (schema: BasicColorSchema, system: BasicColorMode) =>
  schema === 'auto' ? system : schema;

export type AppearanceControls = ReturnType<typeof useProductAppearance>;

export const useProductAppearance = (
  onAppearanceChanged: (color: BasicColorMode) => void,
) => {
  const storedSchema = useCookie<BasicColorSchema>(APPEARANCE_COOKIE_KEY, {
    ...APPEARANCE_COOKIE_OPTIONS,
    default: () => DEFAULT_APPEARANCE,
  });

  if (!validAppearance(storedSchema.value)) {
    console.warn(
      'Received unrecognized appearance value:',
      storedSchema.value,
      '\n\nVacating stored appearance value.',
    );
    storedSchema.value = DEFAULT_APPEARANCE;
  }

  const prefersDark = usePreferredDark();

  const system = computed<BasicColorMode>(() =>
    prefersDark.value ? 'dark' : 'light',
  );

  // resolved eagerly rather than on mount so it agrees with what the pre-paint script
  // already stamped, which is what stops the class from bouncing back once vue takes over
  const documentAppearance = computed(() =>
    resolve(storedSchema.value, system.value),
  );

  useHead({
    // themes the document itself, and every dark: variant keys off this class
    htmlAttrs: { class: documentAppearance },
    script: [{ innerHTML: APPEARANCE_PREPAINT_SCRIPT, tagPosition: 'head' }],
  });

  // css follows the html class, but anything resolved in js has to hydrate against the
  // baked markup first or vue will keep the prerendered value in production builds
  const hydrated = useMounted();

  const state = computed<BasicColorMode>(() =>
    hydrated.value ? documentAppearance.value : PRERENDERED_APPEARANCE,
  );

  const schema = computed<BasicColorSchema>({
    get: () => (hydrated.value ? storedSchema.value : DEFAULT_APPEARANCE),
    // the toggle group clears its value when the active option is clicked again
    set: (value) => {
      if (!validAppearance(value)) return;
      storedSchema.value = value;
    },
  });

  watch(state, onAppearanceChanged);

  onMounted(() => onAppearanceChanged(state.value));

  return Object.assign(schema, { state });
};
