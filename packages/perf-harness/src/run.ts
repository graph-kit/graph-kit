import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { assert, nullThrows } from '@core/utils/assert';
import { type Browser, type Page, chromium } from 'playwright';

import { PROBE_TIMEOUT_MS, ROUTE, VIEWPORT } from './constants.ts';
import {
  type Logger,
  type PageWithProbe,
  measureScene,
} from './measure-scene.ts';
import type { RunResult, SceneResult } from './types.ts';
import { log } from './utils.ts';

const waitForProbe = async (page: Page, url: string) => {
  try {
    return await page.waitForFunction(
      // only resolves once the probe is defined
      () => window.__canvasCallProbe!,
      null,
      { timeout: PROBE_TIMEOUT_MS },
    );
  } catch {
    throw new Error(
      `no __canvasCallProbe on ${url} after ${PROBE_TIMEOUT_MS / 1000}s, is it a dev build?`,
    );
  }
};

type WithProbePageOptions<Result> = {
  browser: Browser;
  url: string;
  logger: Logger;
  task: (pageWithProbe: PageWithProbe) => Promise<Result>;
};

const withProbePage = async <Result>({
  browser,
  url,
  logger,
  task,
}: WithProbePageOptions<Result>) => {
  // new context so stuff like local storage doesn't carry over
  const context = await browser.newContext({ viewport: VIEWPORT });

  try {
    const page = await context.newPage();

    page.on('pageerror', (error) => logger(`page error: ${error.message}`));
    page.on('console', (message) =>
      logger(`console ${message.type()}: ${message.text()}`),
    );

    logger(`navigating to ${url}`);
    await page.goto(url, { waitUntil: 'load' });

    logger('waiting for the probe to register');
    const probe = await waitForProbe(page, url);

    return await task({ page, probe });
  } finally {
    await context.close();
  }
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      url: { type: 'string', default: 'http://localhost:3000' },
      out: { type: 'string' },
      commit: { type: 'string', default: 'unknown' },
    },
  });

  const out = nullThrows(values.out, '--out is required');
  const url = new URL(ROUTE, values.url).toString();

  log(`measuring ${values.commit} at ${url}`);

  log('launching chromium');
  const browser = await chromium.launch();

  const results: SceneResult[] = [];

  try {
    const sceneNames = await withProbePage({
      browser,
      url,
      logger: (message) => log(`  discovery: ${message}`),
      task: ({ probe }) => probe.evaluate((probe) => Object.keys(probe.scenes)),
    });

    assert(sceneNames.length > 0, `the probe on ${url} offers no scenes`);

    log(`${sceneNames.length} scenes: ${sceneNames.join(', ')}`);

    for (const [index, sceneName] of sceneNames.entries()) {
      log(`scene ${index + 1}/${sceneNames.length}: ${sceneName}`);

      const logger = (message: string) => log(`  ${sceneName}: ${message}`);
      results.push(
        await withProbePage({
          browser,
          url,
          logger,
          task: (pageWithProbe) =>
            measureScene({ ...pageWithProbe, sceneName, logger }),
        }),
      );
    }
  } finally {
    log('closing chromium');
    await browser.close();
  }

  const runResult: RunResult = {
    commit: values.commit,
    measuredAt: new Date().toISOString(),
    scenes: results,
  };

  await writeFile(out, JSON.stringify(runResult, null, 2));
  log(`wrote ${results.length} scenes to ${out}`);
};

await main();
