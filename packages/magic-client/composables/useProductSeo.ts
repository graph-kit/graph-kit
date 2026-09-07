import { useHead, useRuntimeConfig, useSeoMeta } from '#imports';
import type { ProductId, ProductManifest } from '@magic/shared/product';
import { manifests, productCanonicalPath } from '@magic/shared/product';

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
    ogSiteName: 'Magic Graphs',
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
};
