import { useHead, useRuntimeConfig, useSeoMeta } from '#imports';
import type { ProductId, ProductManifest } from '@magic/shared/product';
import {
  isProductIndexable,
  manifests,
  productCanonicalPath,
} from '@magic/shared/product';

const SITE_NAME = 'Magic Graphs';

/** every tag a page needs to be indexed and previewed */
export const useProductSeo = (productId: ProductId) => {
  const { siteUrl } = useRuntimeConfig().public;
  const product: ProductManifest = manifests[productId];
  const { title, description, ogImage, robots } = product.meta;

  const url = new URL(productCanonicalPath(productId), siteUrl).href;
  const image = ogImage ? new URL(ogImage, siteUrl).href : undefined;

  useSeoMeta({
    title,
    description,
    robots,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogImage: image,
    twitterCard: image ? 'summary_large_image' : 'summary',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  });

  useHead({ link: [{ rel: 'canonical', href: url }] });

  // a page search engines were told to skip should not be publishing structured data
  // about itself either
  if (!isProductIndexable(productId)) return;

  const webApplication = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: product.name,
    description,
    url,
    ...(image ? { image } : {}),
    applicationCategory: 'EducationalApplication',
    // it runs on a canvas in the browser, so there is nothing to name here
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript and HTML5 canvas support',
    isAccessibleForFree: true,
    // schema.org has no way to say "free" other than an offer priced at zero
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: new URL('/', siteUrl).href,
    },
  };

  const siteRoot = new URL('/', siteUrl).href;

  // the site itself, described once by whichever product is served at the root, rather
  // than once per product
  const webSite =
    url === siteRoot
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            description,
            url: siteRoot,
          },
        ]
      : [];

  useHead({
    script: [...webSite, webApplication].map((node) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(node),
    })),
  });
};
