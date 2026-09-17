import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { nullThrows } from '@core/utils/assert';

import type { FrameCalls, RunResult, SceneResult } from './types.ts';

/**
 * lets the workflow find its own comment again instead of posting a new one.
 * must match the `marker` in `.github/workflows/canvas-call-counter.yaml`
 */
export const COMMENT_MARKER = '<!-- graph-kit-canvas-call-report -->';

// most important stuff for the top of the report
const HEADLINE_COUNTERS = [
  'canvasElementsCreated',
  'drawImage',
  'measureText',
  'fillRect',
  'fill',
  'stroke',
  'save',
] as const;

const round = (value: number) => Math.round(value * 10) / 10;

/** git's default abbreviated hash length */
const shortSha = (commit: string) => commit.slice(0, 7);

const formatDelta = (base: number, head: number) => {
  if (base === head) return '=';

  const absolute = head - base;
  if (base === 0) return `+${round(absolute)} (new)`;

  const ratio = absolute / base;
  const arrow = absolute < 0 ? '⬇' : '⬆';
  const percent = Math.round(ratio * 100);

  return `${arrow} ${percent > 0 ? '+' : ''}${percent}%`;
};

const averageCalls = (frames: FrameCalls[]) => {
  const totals: FrameCalls = {};

  for (const frame of frames) {
    for (const [name, calls] of Object.entries(frame)) {
      totals[name] = (totals[name] ?? 0) + calls;
    }
  }

  const averages: FrameCalls = {};
  for (const [name, total] of Object.entries(totals)) {
    averages[name] = total / frames.length;
  }

  return averages;
};

const sceneTable = (head: SceneResult, base: SceneResult) => {
  const headAverages = averageCalls(head.frames);
  const baseAverages = averageCalls(base.frames);

  const rows = HEADLINE_COUNTERS.map((counter) => {
    const baseValue = round(baseAverages[counter] ?? 0);
    const headValue = round(headAverages[counter] ?? 0);
    return `| ${counter} | ${baseValue} | ${headValue} | ${formatDelta(baseValue, headValue)} |`;
  });

  return [
    `#### \`${head.scene}\` (${head.frames.length} frames)`,
    '',
    '| average per frame | base | head | |',
    '| --- | ---: | ---: | --- |',
    ...rows,
    '',
    ...nonHeadlineChanges(headAverages, baseAverages),
  ].join('\n');
};

/** names every counter outside the headline list that changed */
const nonHeadlineChanges = (
  headAverages: FrameCalls,
  baseAverages: FrameCalls,
) => {
  const changed = Object.keys({ ...baseAverages, ...headAverages })
    .filter((counter) => !HEADLINE_COUNTERS.includes(counter as never))
    .map((counter) => ({
      counter,
      baseValue: round(baseAverages[counter] ?? 0),
      headValue: round(headAverages[counter] ?? 0),
    }))
    .filter(({ baseValue, headValue }) => baseValue !== headValue)
    .sort(
      (previous, next) =>
        Math.abs(next.headValue - next.baseValue) -
        Math.abs(previous.headValue - previous.baseValue),
    );

  if (changed.length === 0) return [];

  const described = changed.map(
    ({ counter, baseValue, headValue }) =>
      `\`${counter}\` ${baseValue} → ${headValue}`,
  );

  return [`Other changes: ${described.join(', ')}.`, ''];
};

const render = (head: RunResult, base: RunResult) => {
  const tables = head.scenes.map((scene) =>
    sceneTable(
      scene,
      nullThrows(
        base.scenes.find((candidate) => candidate.scene === scene.scene),
        `scene ${scene.scene} is missing from the base run`,
      ),
    ),
  );

  return [
    COMMENT_MARKER,
    '## 🎨 Canvas Calls Per Frame',
    '',
    `head \`${shortSha(head.commit)}\` vs base \`${shortSha(base.commit)}\``,
    '',
    ...tables,
  ].join('\n');
};

const readRun = async (path: string): Promise<RunResult> =>
  JSON.parse(await readFile(path, 'utf8'));

const main = async () => {
  const { values } = parseArgs({
    options: {
      head: { type: 'string' },
      base: { type: 'string' },
    },
  });

  const head = await readRun(nullThrows(values.head, '--head is required'));
  const base = await readRun(nullThrows(values.base, '--base is required'));

  process.stdout.write(render(head, base));
};

await main();
