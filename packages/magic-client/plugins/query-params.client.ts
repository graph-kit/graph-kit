import { captureQuery } from '@magic/shared/url';

// first thing on the way in: every plugin runs before nuxt swaps the url out to hydrate
export default defineNuxtPlugin(captureQuery);
