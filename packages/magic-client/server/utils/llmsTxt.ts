import { products } from '@magic/shared/product/manifests';
import { productCategories } from '@magic/shared/product/manifests/categories';
import {
  isProductIndexable,
  productCanonicalPath,
} from '@magic/shared/product/manifests/paths';
import type { ProductManifest } from '@magic/shared/product/manifests/types';

const SUMMARY = [
  '> Interactive computer science theory. Build a graph on an infinite canvas, step',
  '> an algorithm through it and change the graph as it runs, solo or live with others.',
];

/**
 * the body of `/llms.txt`, kept as a plain function so a test can check that it lists
 * the same pages the sitemap does without running the Nuxt server
 */
export const llmsTxt = (siteUrl: string) => {
  const indexable = products.filter((product) =>
    isProductIndexable(product.id),
  );

  const urlOf = (product: ProductManifest) =>
    new URL(productCanonicalPath(product.id), siteUrl).href;

  const link = (product: ProductManifest) =>
    `- [${product.name}](${urlOf(product)}): ${product.meta.description}`;

  const siteRoot = new URL('/', siteUrl).href;
  const home = indexable.filter((product) => urlOf(product) === siteRoot);

  const section = (heading: string, entries: ProductManifest[]) =>
    entries.length === 0 ? [] : [`## ${heading}`, '', ...entries.map(link), ''];

  // grouped the way the experiences menu groups them, so the order carries the same
  // meaning it does in the app
  const grouped = Object.entries(productCategories).flatMap(
    ([category, heading]) =>
      section(
        heading,
        indexable.filter(
          (product) => product.navigation.card?.category === category,
        ),
      ),
  );

  // anything neither the home page nor a category claimed: a product with no card, or
  // one carrying a category that has since been renamed. listed rather than dropped,
  // because a page missing from llms.txt is invisible rather than obviously wrong
  const claimed = new Set([
    ...home.map((product) => product.id),
    ...indexable
      .filter(
        (product) =>
          product.navigation.card?.category !== undefined &&
          product.navigation.card.category in productCategories,
      )
      .map((product) => product.id),
  ]);

  return [
    '# Magic Graphs',
    '',
    ...SUMMARY,
    '',
    ...section('Start Here', home),
    ...grouped,
    ...section(
      'Other',
      indexable.filter((product) => !claimed.has(product.id)),
    ),
  ].join('\n');
};
