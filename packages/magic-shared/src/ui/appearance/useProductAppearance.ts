import {
  BasicColorMode,
  BasicColorSchema,
  useMounted,
  usePreferredDark,
} from '@vueuse/core';
import { useCookie, useHead, useNuxtApp } from 'nuxt/app';

import { computed, onMounted, watch } from 'vue';

import {
  APPEARANCE_COOKIE_KEY,
  APPEARANCE_COOKIE_OPTIONS,
  SYSTEM_APPEARANCE_COOKIE_KEY,
  appearances,
} from './appearances.ts';

const DEFAULT_SCHEMA: BasicColorSchema = 'auto';
const DEFAULT_SYSTEM: BasicColorMode = 'light';

const validAppearance = (appearance: unknown): appearance is BasicColorSchema =>
  appearances.some((candidate) => candidate === appearance);

const resolve = (schema: BasicColorSchema, system: BasicColorMode) =>
  schema === 'auto' ? system : schema;

export type AppearanceControls = ReturnType<typeof useProductAppearance>;

export const useProductAppearance = (
  onAppearanceChanged: (color: BasicColorMode) => void,
) => {
  // a cookie rides along on the request, so the server resolves the same appearance
  // the client does rather than guessing and correcting after hydration
  const storedSchema = useCookie<BasicColorSchema>(APPEARANCE_COOKIE_KEY, {
    ...APPEARANCE_COOKIE_OPTIONS,
    default: () => DEFAULT_SCHEMA,
  });

  // prefers-color-scheme is readable only in the browser, so the last answer it gave
  // is stored too, which is what lets the server resolve 'auto'
  const storedSystem = useCookie<BasicColorMode>(SYSTEM_APPEARANCE_COOKIE_KEY, {
    ...APPEARANCE_COOKIE_OPTIONS,
    default: () => DEFAULT_SYSTEM,
  });

  if (!validAppearance(storedSchema.value)) {
    console.warn(
      'Received unrecognized appearance value:',
      storedSchema.value,
      '\n\nVacating stored appearance value.',
    );
    storedSchema.value = DEFAULT_SCHEMA;
  }

  // prerendered markup is baked before any request exists, so no cookie reached it and
  // the first client render has to repeat those defaults before correcting on mount
  const nuxtApp = useNuxtApp();
  const hydratingPrerendered =
    Boolean(nuxtApp.payload.prerenderedAt) && nuxtApp.isHydrating;
  const hydrated = useMounted();
  const cookiesMatchMarkup = computed(
    () => !hydratingPrerendered || hydrated.value,
  );

  const prefersDark = usePreferredDark();

  const system = computed<BasicColorMode>(() =>
    prefersDark.value ? 'dark' : 'light',
  );

  const state = computed<BasicColorMode>(() =>
    cookiesMatchMarkup.value
      ? resolve(storedSchema.value, storedSystem.value)
      : resolve(DEFAULT_SCHEMA, DEFAULT_SYSTEM),
  );

  const schema = computed<BasicColorSchema>({
    get: () => (cookiesMatchMarkup.value ? storedSchema.value : DEFAULT_SCHEMA),
    set: (value) => (storedSchema.value = value),
  });

  // themes the document itself, and being part of the render means the server emits it
  useHead({ htmlAttrs: { class: state } });

  watch(state, onAppearanceChanged);

  watch(system, (value) => (storedSystem.value = value));

  onMounted(() => {
    onAppearanceChanged(state.value);
    // recording what the browser actually reports keeps the next server render honest
    storedSystem.value = system.value;
  });

  return Object.assign(schema, { state });
};
