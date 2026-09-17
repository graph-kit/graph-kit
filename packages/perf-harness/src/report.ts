import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { nullThrows } from '@core/utils/assert';

import type { RunResult, ScenarioResult } from './types.ts';

/** lets the workflow find its own comment again instead of posting a new one */
export const COMMENT_MARKER = '<!-- magic-graphs-perf-bot -->';

// most important stuff to highlight
const HEADLINE_COUNTERS = [
  'canvasElementsCreated',
  'drawImage',
  'measureText',
  'fillRect',
  'fill',
  'stroke',
  'save',
] as const;

/** below this a difference is rounding or a stray frame, not a change */
const NOTABLE_DELTA = 0.1;

/**
 * a counter that moves by a fraction of a call per frame is not news, however
 * large the percentage looks next to a base of nearly nothing
 */
const NOTABLE_CALLS_PER_FRAME = 1;

const round = (value: number) => Math.round(value * 10) / 10;

const formatDelta = (base: number | undefined, head: number) => {
  if (base === undefined) return '';
  if (base === 0 && head === 0) return '=';

  const absolute = head - base;
  if (base === 0) return `+${round(absolute)} (new)`;

  const ratio = absolute / base;
  if (Math.abs(ratio) < NOTABLE_DELTA) return '=';

  const arrow = absolute < 0 ? '⬇' : '⬆';
  const percent = Math.round(ratio * 100);

  return `${arrow} ${percent > 0 ? '+' : ''}${percent}%`;
};

const scenarioTable = (head: ScenarioResult, base?: ScenarioResult) => {
  const counters = [...HEADLINE_COUNTERS].filter(
    (counter) =>
      head.perFrame[counter] !== undefined ||
      base?.perFrame[counter] !== undefined,
  );

  const header = base
    ? '| per frame | base | head | |\n| --- | ---: | ---: | --- |'
    : '| per frame | head |\n| --- | ---: |';

  const row = (label: string, headValue: number, baseValue?: number) =>
    base
      ? `| ${label} | ${round(baseValue ?? 0)} | ${round(headValue)} | ${formatDelta(baseValue ?? 0, headValue)} |`
      : `| ${label} | ${round(headValue)} |`;

  const rows = counters.map((counter) =>
    row(counter, head.perFrame[counter] ?? 0, base?.perFrame[counter]),
  );

  return [
    `#### \`${head.scenario}\` (${head.nodes} nodes, ${head.frames} frames)`,
    '',
    header,
    ...rows,
    // a table that runs straight into the next heading stops being a table
    '',
    ...alsoMoved(head, base),
  ].join('\n');
};

/*
  there used to be a total here, and it was worse than nothing. summing canvas
  calls treats them as interchangeable, and they are not: removing 85
  createElement plus getContext pairs per frame is the entire point of a change
  that moves a total of seven thousand by two percent, so the row reported the
  headline result as a rounding error.

  what the total was really for was catching a counter nobody thought to put in
  the headline list. that is worth keeping, so it is done directly: name the
  ones that moved, and stay quiet when none did
*/
const alsoMoved = (head: ScenarioResult, base?: ScenarioResult) => {
  if (!base) return [];

  const counterNames = new Set([
    ...Object.keys(head.perFrame),
    ...Object.keys(base.perFrame),
  ]);

  const moved = [...counterNames]
    .filter((counter) => !HEADLINE_COUNTERS.includes(counter as never))
    .map((counter) => ({
      counter,
      baseValue: base.perFrame[counter] ?? 0,
      headValue: head.perFrame[counter] ?? 0,
    }))
    .filter(({ baseValue, headValue }) => {
      const absolute = Math.abs(headValue - baseValue);
      if (absolute < NOTABLE_CALLS_PER_FRAME) return false;
      return baseValue === 0 || absolute / baseValue >= NOTABLE_DELTA;
    })
    .sort(
      (a, b) =>
        Math.abs(b.headValue - b.baseValue) -
        Math.abs(a.headValue - a.baseValue),
    );

  if (moved.length === 0) return [];

  const described = moved.map(
    ({ counter, baseValue, headValue }) =>
      `\`${counter}\` ${round(baseValue)} → ${round(headValue)}`,
  );

  return [`Also moved: ${described.join(', ')}.`, ''];
};

const render = (head: RunResult, base?: RunResult) => {
  const tables = head.scenarios.map((scenario) =>
    scenarioTable(
      scenario,
      base?.scenarios.find(
        (candidate) => candidate.scenario === scenario.scenario,
      ),
    ),
  );

  const heading = base
    ? `head \`${head.commit.slice(0, 7)}\` vs base \`${base.commit.slice(0, 7)}\``
    : `head \`${head.commit.slice(0, 7)}\``;

  return [
    COMMENT_MARKER,
    '### canvas perf',
    '',
    heading,
    '',
    'Counts are per repaint and exact: the same scene issues the same calls on',
    'any machine, so a change here is a real change in what a frame does.',
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
  const base = values.base ? await readRun(values.base) : undefined;

  process.stdout.write(render(head, base));
};

await main();
