import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { assert } from '@core/utils/assert';
import { type Browser, type Page, chromium } from 'playwright';

import { PROBE_TIMEOUT_MS, ROUTE, VIEWPORT } from './constants.ts';
import {
  MEASURE_MS,
  SCENE_SEED,
  SETTLE_MS,
  type Scenario,
  scenarios,
} from './scenarios.ts';
import type {
  PerfReport,
  PerfTools,
  RunResult,
  ScenarioResult,
} from './types.ts';

declare global {
  interface Window {
    __graphPerf?: PerfTools;
  }
}

/** big enough that a 50 node graph is not scrolled off screen */
const VIEWPORT = { width: 1440, height: 900 };

const TOOLS_TIMEOUT_MS = 30_000;

/*
  page.evaluate has no timeout of its own, so a scene that never returns hangs
  the run until the job is killed, with nothing in the log to say where. long
  enough that a slow runner building fifty nodes is not cut off
*/
const SCENE_TIMEOUT_MS = 60_000;

const RUN_STARTED_AT = Date.now();

const log = (message: string) => {
  const elapsed = ((Date.now() - RUN_STARTED_AT) / 1000).toFixed(1);
  // stdout carries the report itself when --out is not given
  process.stderr.write(`[${elapsed.padStart(6)}s] ${message}\n`);
};

/** turns a hang into a failure that says which scenario and how long it waited */
const withTimeout = async <T>(work: Promise<T>, ms: number, what: string) => {
  let timer: NodeJS.Timeout | undefined;

  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${what} after ${ms / 1000}s.`)),
      ms,
    );
  });

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

  const serialized = JSON.stringify(runResult, null, 2);

  if (values.out) {
    await writeFile(values.out, serialized);
    log(`wrote ${results.length} scenes to ${values.out}`);
  } else {
    process.stdout.write(serialized);
  }
};

await main();
