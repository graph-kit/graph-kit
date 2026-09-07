import { products } from '@magic/shared/product/manifests';
import {
  isProductIndexable,
  productCanonicalPath,
} from '@magic/shared/product/manifests/paths';

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public;

  const urls = products
    .filter((product) => isProductIndexable(product.id))
    .map((product) => new URL(productCanonicalPath(product.id), siteUrl).href);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
});
