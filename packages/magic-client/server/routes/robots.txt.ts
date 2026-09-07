export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public;

  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap.xml', siteUrl).href}`,
    '',
  ].join('\n');
});
