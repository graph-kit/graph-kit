import { products } from '@magic/shared/product/manifests';
import {
  isProductIndexable,
  productCanonicalPath,
} from '@magic/shared/product/manifests/paths';

export type AuditRoute = {
  /** what the report calls this page */
  name: string;
  path: string;
};

/**
 * the pages worth auditing, derived from the manifests the sitemap and llms.txt already
 * read, so a product added later is audited without anyone remembering to add it here.
 *
 * noindex pages are skipped for the same reason they are skipped there: the dev
 * playground is not a page anyone is served
 */
export const auditRoutes: AuditRoute[] = products
  .filter((product) => isProductIndexable(product.id))
  .map((product) => ({
    name: product.name,
    path: productCanonicalPath(product.id),
  }));
