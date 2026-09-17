import { assert, nullThrows } from '@core/utils/assert';
import type { JSHandle, Page } from 'playwright';

import {
  MEASURE_MS,
  PAINT_TIMEOUT_MS,
  SCENE_TIMEOUT_MS,
  VIEWPORT,
} from './constants.ts';
import type { CanvasCallProbe, SceneResult } from './types.ts';
import { withTimeout } from './utils.ts';

export type Logger = (message: string) => void;

export type PageWithProbe = {
  page: Page;
  probe: JSHandle<CanvasCallProbe>;
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

type MeasureSceneOptions = PageWithProbe & {
  sceneName: string;
  logger: Logger;
};

export const measureScene = async ({
  page,
  probe,
  sceneName,
  logger,
}: MeasureSceneOptions): Promise<SceneResult> => {
  logger('building the scene');
  await withTimeout({
    task: probe.evaluate(
      (probe, name) => probe.scenes[name].build(),
      sceneName,
    ),
    timeoutMs: SCENE_TIMEOUT_MS,
    failureMessage: `${sceneName} never finished building`,
  });

  logger('waiting for the scene to paint');
  await withTimeout({
    task: page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    ),
    timeoutMs: PAINT_TIMEOUT_MS,
    failureMessage: `${sceneName} never painted`,
  });

  logger('starting the call counter');
  await probe.evaluate((probe) => probe.counter.start());

  const shouldSweepCursor = await probe.evaluate(
    (probe, name) => probe.scenes[name].sweepCursor ?? false,
    sceneName,
  );

  if (shouldSweepCursor) {
    logger(`sweeping the cursor for ${MEASURE_MS}ms`);
    await sweepCursor(page, MEASURE_MS);
  } else {
    logger(`measuring idle for ${MEASURE_MS}ms`);
    await page.waitForTimeout(MEASURE_MS);
  }

  logger('collecting the frames');
  const frames = nullThrows(
    await probe.evaluate((probe) => probe.counter.get()),
    `${sceneName} has no frames to collect because its counter never started`,
  );

  assert(
    frames.length > 0,
    `${sceneName} recorded no frames because the page never repainted`,
  );

  logger(`done, ${frames.length} frames`);

  return { scene: sceneName, frames };
};
