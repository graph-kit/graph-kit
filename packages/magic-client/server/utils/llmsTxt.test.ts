import { products } from '@magic/shared/product/manifests';
import {
  isProductIndexable,
  productCanonicalPath,
} from '@magic/shared/product/manifests/paths';
import { describe, expect, it } from 'vitest';

import { llmsTxt } from './llmsTxt.ts';

const SITE_URL = 'https://magicgraphs.app';

/** what `sitemap.xml` lists, derived the same way it derives it */
const sitemapUrls = products
  .filter((product) => isProductIndexable(product.id))
  .map((product) => new URL(productCanonicalPath(product.id), SITE_URL).href);

describe(llmsTxt, () => {
  const body = llmsTxt(SITE_URL);

  it('lists exactly the pages the sitemap lists', () => {
    const listed = [...body.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
      ([, url]) => url,
    );

    expect(listed.toSorted()).toEqual(sitemapUrls.toSorted());
  });

  it('lists every page once, so a category rename cannot double up an entry', () => {
    const listed = [...body.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
      ([, url]) => url,
    );

    expect(new Set(listed).size).toBe(listed.length);
  });

  it('leaves no product without a description, which is the whole point of the file', () => {
    for (const line of body.split('\n').filter((l) => l.startsWith('- ['))) {
      expect(line).toMatch(/\): .+$/);
    }
  });

  it('omits a product search engines were told to skip', () => {
    const notIndexable = products.filter(
      (product) => !isProductIndexable(product.id),
    );

    // guards the test itself: if nothing is noindex, this asserts nothing
    expect(notIndexable.length).toBeGreaterThan(0);

    for (const product of notIndexable) {
      expect(body).not.toContain(productCanonicalPath(product.id));
    }
  });
});
