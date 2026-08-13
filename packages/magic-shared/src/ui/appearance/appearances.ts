import { BasicColorSchema } from '@vueuse/core';
import { CookieOptions } from 'nuxt/app';

export const appearances: BasicColorSchema[] = ['light', 'dark', 'auto'];

/** the appearance the user picked, one of {@link appearances} */
export const APPEARANCE_COOKIE_KEY = 'product-appearance';

/** the last light/dark answer the browser gave, so the server can resolve 'auto' */
export const SYSTEM_APPEARANCE_COOKIE_KEY = 'product-appearance-system';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** cookies rather than local storage so the appearance travels with the request */
export const APPEARANCE_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  maxAge: ONE_YEAR_IN_SECONDS,
} satisfies CookieOptions;
