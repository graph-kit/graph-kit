import { BasicColorSchema } from '@vueuse/core';
import { CookieOptions } from 'nuxt/app';

export const appearances: BasicColorSchema[] = ['light', 'dark', 'auto'];

export const DEFAULT_APPEARANCE: BasicColorSchema = 'auto';

/** the appearance the user picked, one of {@link appearances} */
export const APPEARANCE_COOKIE_KEY = 'product-appearance';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** cookies rather than local storage so the appearance travels with the request */
export const APPEARANCE_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax',
  maxAge: ONE_YEAR_IN_SECONDS,
} satisfies CookieOptions;

// every route is prerendered, so the markup is baked before any request exists and the
// server never sees the cookie. this runs before first paint to stamp the appearance the
// rest of the styling keys off, which is what keeps the page from flashing light first.
// written without arrow functions so the source carries no angle brackets to be escaped.
export const APPEARANCE_PREPAINT_SCRIPT = `
!function () {
  var match = document.cookie.match(/(?:^|;\\s*)${APPEARANCE_COOKIE_KEY}=([^;]*)/);
  var appearance = match ? decodeURIComponent(match[1]).replace(/^"|"$/g, '') : '${DEFAULT_APPEARANCE}';
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark = appearance === 'dark' || (appearance !== 'light' && prefersDark);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(dark ? 'dark' : 'light');
}();
`;
