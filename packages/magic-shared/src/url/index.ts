import { nullThrows } from '@core/utils/assert';
import { onNuxtReady } from 'nuxt/app';

type QueryEdit = (query: URLSearchParams) => void;

let query: URLSearchParams | null = null;
let urlIsOurs = false;
const heldEdits: QueryEdit[] = [];

const applyToUrl = (edit: QueryEdit) => {
  const url = new URL(window.location.href);
  edit(url.searchParams);
  if (url.href === window.location.href) return;
  window.history.replaceState({}, '', url);
};

/**
 * Runs before the app boots. Nuxt hydrates a prerendered page on the url it was built
 * for, which carries no query, and only puts the opened url back once hydration ends, so
 * the query is unreadable until then and anything written to the url is overwritten.
 */
export const captureQuery = () => {
  query = new URLSearchParams(window.location.search);
  onNuxtReady(() => {
    urlIsOurs = true;
    for (const edit of heldEdits) applyToUrl(edit);
    heldEdits.length = 0;
  });
};

const requireQuery = (param: string) =>
  nullThrows(query, `url: touched "${param}" before the query was captured`);

/**
 * the captured query as a url suffix, for building hrefs. empty on the server, where
 * there is no query to carry, so a link can be rendered before capture rather than throw.
 */
export const queryString = () => {
  const search = query?.toString();
  return search ? `?${search}` : '';
};

export const queryParam = (param: string) => requireQuery(param).get(param);

const editQuery = (param: string, edit: QueryEdit) => {
  edit(requireQuery(param));
  if (!urlIsOurs) return void heldEdits.push(edit);
  applyToUrl(edit);
};

export const writeQueryParam = (param: string, value: string) =>
  editQuery(param, (search) => search.set(param, value));

export const stripQueryParam = (param: string) =>
  editQuery(param, (search) => search.delete(param));
