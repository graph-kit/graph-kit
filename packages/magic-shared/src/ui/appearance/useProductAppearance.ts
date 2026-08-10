import {
  BasicColorMode,
  BasicColorSchema,
  useColorMode,
  useMounted,
} from '@vueuse/core';

import { computed, onMounted, watch } from 'vue';

import { APPEARANCE_STORAGE_KEY, appearances } from './appearances.ts';

// values useColorMode resolves to on the server, where neither localStorage nor
// prefers-color-scheme is readable
const SSR_SCHEMA: BasicColorSchema = 'auto';
const SSR_MODE: BasicColorMode = 'light';

const validAppearance = (appearance: unknown): appearance is BasicColorSchema =>
  appearances.some((a) => a === appearance);

export type AppearanceControls = ReturnType<typeof useProductAppearance>;

export const useProductAppearance = (
  onAppearanceChanged: (color: BasicColorMode) => void,
) => {
  const colorMode = useColorMode({
    emitAuto: true,
    storageKey: APPEARANCE_STORAGE_KEY,
  });

  const hydrated = useMounted();

  // the stored appearance is invisible to the server, so render the server's answer
  // until hydration finishes or the markup the client builds wont match what it got
  const state = computed(() =>
    hydrated.value ? colorMode.state.value : SSR_MODE,
  );

  const schema = computed<BasicColorSchema>({
    get: () => (hydrated.value ? colorMode.value : SSR_SCHEMA),
    set: (value) => (colorMode.value = value),
  });

  const appearance = Object.assign(schema, {
    store: colorMode.store,
    system: colorMode.system,
    state,
  });

  const setValue = () => {
    const appearanceValue = colorMode.state.value;
    if (!validAppearance(appearanceValue)) {
      console.warn(
        'Received unrecognized appearance value:',
        appearanceValue,
        '\n\nVacating stored appearance value.',
      );
      localStorage.removeItem(APPEARANCE_STORAGE_KEY);
      return;
    }
    onAppearanceChanged(appearanceValue);
  };

  watch(colorMode.state, setValue);

  onMounted(setValue);

  return appearance;
};
