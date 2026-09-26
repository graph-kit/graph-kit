/**
 * Runs axe over every indexable page of a running instance and reports what fails
 * WCAG 2.1 at levels A and AA.
 *
 * Chromium only, and both appearances: a rule like color-contrast answers differently
 * against the light and dark presets, and auditing one of them is auditing half the app.
 *
 * Reports by default and only fails the run under `--gate`, so it can be stood up and
 * read while there is still a backlog to work through.
 *
 * @example
 * pnpm --filter @graph/a11y-harness a11y --url http://localhost:3000
 * pnpm --filter @graph/a11y-harness a11y --gate --out a11y.json
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { AxeBuilder } from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { type Browser, type Page, chromium } from 'playwright';

import { auditRoutes } from './routes.ts';
import type { Appearance, AuditReport, Finding, PageAudit } from './types.ts';

/** what makes this an AA audit rather than an opinion */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const APPEARANCES: Appearance[] = ['light', 'dark'];

/** the cookie the shell reads before first paint, see `appearances.ts` */
const APPEARANCE_COOKIE = 'shell-appearance';

/** wide enough that the shell lays out as it does on a desktop rather than collapsing */
const VIEWPORT = { width: 1440, height: 900 };

/**
 * the canvas products mount, seed a scene and settle. axe reads the DOM, not the canvas,
 * but the shell chrome around it is built during that settle
 */
const SETTLE_MS = 2_500;

const log = (message: string) => process.stderr.write(`${message}\n`);

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:3000' },
    out: { type: 'string' },
    gate: { type: 'boolean', default: false },
  },
});

/*
  nix has no working loader for playwright's downloaded browsers, so the launch takes an
  executable from the environment when one is named and falls back to the bundled one
  everywhere else
*/
const executablePath = process.env.CHROMIUM_PATH;

const auditPage = async (
  page: Page,
  route: (typeof auditRoutes)[number],
  appearance: Appearance,
): Promise<PageAudit> => {
  await page.goto(new URL(route.path, values.url).href, {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(SETTLE_MS);

  /*
    a static host in single page mode rewrites every unknown path to index.html, which
    serves the landing page under every url and turns this run into the same page audited
    once per route: uniform, clean, and about nothing. the prerendered canonical names the
    page that was actually built, so it is the one thing on the page that can tell them
    apart
  */
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute('href');

  if (canonical && new URL(canonical).pathname !== route.path) {
    throw new Error(
      `${route.path} served the page for ${new URL(canonical).pathname}. ` +
        'the host is rewriting routes, so serve the prerendered output directly ' +
        'rather than in single page mode',
    );
  }

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const toFindings = (results: Result[]): Finding[] =>
    results.map((result) => ({
      ruleId: result.id,
      impact: result.impact ?? 'unknown',
      help: result.help,
      helpUrl: result.helpUrl,
      tags: result.tags.filter((tag) => tag.startsWith('wcag')),
      targets: result.nodes.map((node) => node.target.join(' ')),
    }));

  return {
    route: route.path,
    name: route.name,
    appearance,
    findings: toFindings(results.violations),
    needsReview: toFindings(results.incomplete),
  };
};

const audit = async (browser: Browser): Promise<AuditReport> => {
  const pages: PageAudit[] = [];

  for (const appearance of APPEARANCES) {
    const context = await browser.newContext({ viewport: VIEWPORT });
    await context.addCookies([
      {
        name: APPEARANCE_COOKIE,
        value: appearance,
        url: values.url,
      },
    ]);

    const page = await context.newPage();

    for (const route of auditRoutes) {
      log(`auditing ${route.path} (${appearance})`);
      pages.push(await auditPage(page, route, appearance));
    }

    await context.close();
  }

  return { url: values.url, tags: WCAG_TAGS, pages };
};

/** one line per rule, worst first, since the rule is the unit of work not the element */
const summarize = (report: AuditReport) => {
  const order = ['critical', 'serious', 'moderate', 'minor', 'unknown'];

  const byRule = new Map<string, { finding: Finding; elements: number }>();

  for (const page of report.pages) {
    for (const finding of page.findings) {
      const seen = byRule.get(finding.ruleId);
      if (seen) seen.elements += finding.targets.length;
      else
        byRule.set(finding.ruleId, {
          finding,
          elements: finding.targets.length,
        });
    }
  }

  const rules = [...byRule.values()].sort((a, b) => {
    const impact =
      order.indexOf(a.finding.impact) - order.indexOf(b.finding.impact);
    return impact !== 0 ? impact : b.elements - a.elements;
  });

  const total = rules.reduce((sum, { elements }) => sum + elements, 0);

  const review = report.pages.reduce(
    (sum, page) =>
      sum +
      page.needsReview.reduce((n, finding) => n + finding.targets.length, 0),
    0,
  );

  log('');
  log(`WCAG 2.1 A/AA: ${rules.length} rules failing, ${total} elements`);
  log('');

  for (const { finding, elements } of rules) {
    log(
      `  ${finding.impact.padEnd(9)} ${String(elements).padStart(4)}  ${finding.ruleId}`,
    );
    log(`  ${' '.repeat(9)} ${' '.repeat(4)}  ${finding.help}`);
  }

  log('');
  log(
    `${review} elements axe could not decide on, most of them contrast over a canvas. ` +
      'these are not failures and not passes: an AA claim needs a human on each',
  );
  log('');

  return total;
};

const browser = await chromium.launch({ executablePath });

try {
  const report = await audit(browser);
  const total = summarize(report);

  if (values.out) {
    await writeFile(values.out, JSON.stringify(report, null, 2));
    log(`wrote ${values.out}`);
  }

  if (values.gate && total > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
