import { llmsTxt } from '../utils/llmsTxt.ts';

/**
 * https://llmstxt.org, the plain text counterpart to the sitemap: the same pages,
 * described well enough that a model answering a question about them does not have to
 * render a canvas app to find out what they do
 */
export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public;
  return llmsTxt(siteUrl);
});
