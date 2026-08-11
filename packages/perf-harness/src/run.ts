/**
 * Drives a running instance of the app through the perf scenarios and writes
 * the numbers to JSON.
 *
 * Chromium only. What comes back is a count of the canvas calls our own code
 * makes, which is the same number on every engine, so a second browser would
 * cost minutes and tell us nothing new. It is also why these numbers survive a
 * shared CI runner where wall clock timings would not.
 *
 * @example
 * node src/run.ts --url http://localhost:3000 --out head.json
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { type Page, chromium } from 'playwright';

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

/*
  stderr because stdout carries the report itself when --out is not given.

  every line is stamped with how far into the run it happened and names the
  stage it is entering rather than the one it finished, so a run that dies or
  hangs points at what it was doing instead of leaving the last completed step
  as the only clue
*/
const log = (message: string) => {
  const elapsed = ((Date.now() - RUN_STARTED_AT) / 1000).toFixed(1);
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
    return await Promise.race([work, expiry]);
  } finally {
    clearTimeout(timer);
  }
};

const waitForPerfTools = async (page: Page, url: string) => {
  try {
    await page.waitForFunction(() => window.__graphPerf !== undefined, null, {
      timeout: TOOLS_TIMEOUT_MS,
    });
  } catch {
    throw new Error(
      `no __graphPerf on ${url} after ${TOOLS_TIMEOUT_MS / 1000}s.\n` +
        'the perf tools only start on a dev build, so check the server is ' +
        '`nuxt dev` and not a generated one. if this is the base half of a ' +
        'comparison, the base commit may simply predate the perf tooling, in ' +
        'which case there is nothing there to measure yet.',
    );
  }
};

/*
  a cursor parked in one spot tells us nothing about hit testing, and a single
  jump tells us about one frame. this keeps it moving across the canvas for the
  whole measuring window, which is what a user dragging their mouse around
  actually costs
*/
const sweepCursor = async (page: Page, durationMs: number) => {
  const steps = 60;
  const stepDelay = durationMs / steps;

  for (let step = 0; step < steps; step++) {
    const progress = step / steps;
    await page.mouse.move(
      VIEWPORT.width * (0.15 + 0.7 * progress),
      VIEWPORT.height * (0.3 + 0.4 * Math.sin(progress * Math.PI * 2)),
    );
    await page.waitForTimeout(stepDelay);
  }
};

const measureScenario = async (
  page: Page,
  baseUrl: string,
  scenario: Scenario,
): Promise<ScenarioResult> => {
  const url = new URL(scenario.route, baseUrl).toString();
  const stage = (message: string) => log(`  ${scenario.name}: ${message}`);

  /*
    the page's own failures are invisible from here otherwise. a scene that
    throws surfaces as a stalled evaluate or an empty report, and this is what
    says which it was
  */
  page.on('pageerror', (error) => stage(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') stage(`console error: ${message.text()}`);
  });

  stage(`navigating to ${url}`);
  await page.goto(url, { waitUntil: 'load' });

  stage('waiting for the perf tools to register');
  await waitForPerfTools(page, url);

  stage(`building a ${scenario.nodes} node scene at seed ${SCENE_SEED}`);
  await withTimeout(
    page.evaluate(
      ([nodes, seed]) => window.__graphPerf?.scene({ nodes, seed }),
      [scenario.nodes, SCENE_SEED],
    ),
    SCENE_TIMEOUT_MS,
    `${scenario.name} never finished building its scene`,
  );

  // a graph still animating its nodes in draws differently from a settled one
  stage(`settling for ${SETTLE_MS}ms`);
  await page.waitForTimeout(SETTLE_MS);

  stage('starting the call counter');
  await page.evaluate(() => {
    window.__graphPerf?.countCalls();
    window.__graphPerf?.reset();
  });

  if (scenario.sweepCursor) {
    stage(`sweeping the cursor for ${MEASURE_MS}ms`);
    await sweepCursor(page, MEASURE_MS);
  } else {
    stage(`measuring idle for ${MEASURE_MS}ms`);
    await page.waitForTimeout(MEASURE_MS);
  }

  stage('collecting the report');
  const report = await page.evaluate(
    () => window.__graphPerf?.report() as PerfReport,
  );

  /*
    zero frames means requestAnimationFrame never ran, which happens when the
    page is treated as hidden. the per frame numbers would all be zero and look
    like a spectacular improvement, so this fails instead
  */
  const frames = report.calls?.frames ?? 0;
  if (frames === 0) {
    throw new Error(
      `${scenario.name} recorded no frames. the page never repainted, so ` +
        'these numbers would be fiction rather than an improvement.',
    );
  }

  stage(
    `done, ${frames} frames at ${report.timing.fps.toFixed(1)}fps, ` +
      `draw p50 ${report.timing.draw.p50.toFixed(2)}ms`,
  );

  return {
    scenario: scenario.name,
    nodes: scenario.nodes,
    frames,
    perFrame: report.calls?.perFrame ?? {},
    timing: report.timing,
  };
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      url: { type: 'string', default: 'http://localhost:3000' },
      out: { type: 'string' },
      commit: { type: 'string', default: 'unknown' },
    },
  });

  log(`measuring ${values.commit} at ${values.url}`);
  log(
    `${scenarios.length} scenarios: ${scenarios.map(({ name }) => name).join(', ')}`,
  );

  log('launching chromium');
  const browser = await chromium.launch();

  const results: ScenarioResult[] = [];

  try {
    for (const [index, scenario] of scenarios.entries()) {
      log(`scenario ${index + 1}/${scenarios.length}: ${scenario.name}`);

      /*
        a context per scenario, because the products persist their graph to
        local storage and restore it on mount. sharing one leaves every scenario
        after the first building its scene on top of the previous one, which
        both inflates the size being measured and collides the scene's node ids
      */
      const context = await browser.newContext({ viewport: VIEWPORT });

      try {
        const page = await context.newPage();
        results.push(await measureScenario(page, values.url, scenario));
      } finally {
        await context.close();
      }
    }
  } finally {
    log('closing chromium');
    await browser.close();
  }

  const runResult: RunResult = {
    commit: values.commit,
    measuredAt: new Date().toISOString(),
    scenarios: results,
  };

  const serialized = JSON.stringify(runResult, null, 2);

  if (values.out) {
    await writeFile(values.out, serialized);
    log(`wrote ${results.length} scenarios to ${values.out}`);
  } else {
    process.stdout.write(serialized);
  }
};

/*
  the stack alone lands in the log as an unattributed playwright trace. this
  names the run that failed first, so the workflow's two measure steps are
  telling apart at a glance
*/
try {
  await main();
} catch (error) {
  log(`run failed: ${error instanceof Error ? error.message : String(error)}`);
  throw error;
}
