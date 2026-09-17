/**
 * Runs the perf scenarios against a running app and writes the results as JSON.
 *
 * @example
 * node src/run.ts --url http://localhost:3000 --out head.json
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { type Page, chromium } from 'playwright';

import {
  PAINT_TIMEOUT_MS,
  ROUTE,
  SCENE_TIMEOUT_MS,
  TOOLS_TIMEOUT_MS,
  VIEWPORT,
} from './constants.ts';
import {
  MEASURE_MS,
  type Scenario,
  scenarios,
} from './scenarios.ts';
import type {
  PerfReport,
  PerfTools,
  RunResult,
  ScenarioResult,
} from './types.ts';
import { log, withTimeout } from './utils.ts';

declare global {
  interface Window {
    __graphPerf?: PerfTools;
  }
}

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

/** moves the cursor for the whole window so hit testing runs on every frame */
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
  const url = new URL(ROUTE, baseUrl).toString();
  const stage = (message: string) => log(`  ${scenario.name}: ${message}`);

  page.on('pageerror', (error) => stage(`page error: ${error.message}`));
  page.on('console', (message) =>
    stage(`console ${message.type()}: ${message.text()}`),
  );

  stage(`navigating to ${url}`);
  await page.goto(url, { waitUntil: 'load' });

  stage('waiting for the perf tools to register');
  await waitForPerfTools(page, url);

  stage(`building a ${scenario.nodes} node scene`);
  await withTimeout({
    task: page.evaluate(
      (nodes) => window.__graphPerf?.scene({ nodes }),
      scenario.nodes,
    ),
    timeoutMs: SCENE_TIMEOUT_MS,
    failureMessage: `${scenario.name} never finished building its scene`,
  });

  stage('waiting for the scene to paint');
  await withTimeout({
    task: page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    ),
    timeoutMs: PAINT_TIMEOUT_MS,
    failureMessage: `${scenario.name} never painted its scene`,
  });

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

  stage(`done, ${frames} frames`);

  return {
    scenario: scenario.name,
    nodes: scenario.nodes,
    frames,
    perFrame: report.calls?.perFrame ?? {},
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
