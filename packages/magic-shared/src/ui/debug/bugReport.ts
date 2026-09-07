import type { CanvasSurface } from '@canvas/surface/types';

import { Shell } from '../../product/types.ts';
import { UNKNOWN } from '../../user-agent/parseUserAgent.ts';
import { getLink } from '../link-sharing/linkPayload.ts';

/*
  the run, written down: everything a reader who was not there would otherwise have to
  ask the reporter for. the debug panels answer the same questions, but only to whoever
  is sitting in front of them, and only as much of a value as the column had room for

  one reading per row, `section,key,value`, so a report pasted into an issue reads as
  plain text and still parses back into fields later. sections are the panels' own
  groupings, so a row here can be found on screen
*/

/** what a reading can be before it is written down */
type ReportValue = string | number | boolean | undefined;

type ReportRow = [section: string, key: string, value: string];

const COLUMNS = ['section', 'key', 'value'];

/** payloads past this are summarized rather than pasted, see {@link stateSection} */
const MAX_PAYLOAD_CHARS = 20_000;

const format = (value: ReportValue) =>
  value === undefined ? UNKNOWN : String(value);

/** rfc 4180: quote anything carrying a delimiter, and double the quotes inside it */
const escape = (field: string) =>
  /[",\n\r]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field;

const toCsv = (rows: ReportRow[]) =>
  [COLUMNS, ...rows].map((row) => row.map(escape).join(',')).join('\n');

const section = (
  name: string,
  readings: Record<string, ReportValue>,
): ReportRow[] =>
  Object.entries(readings).map(([key, value]) => [name, key, format(value)]);

const round = (value: number) => Math.round(value);

const sessionSection = (shell: Shell): ReportRow[] =>
  section('session', {
    'reported at': new Date().toISOString(),
    'open for ms': round(performance.now()),
    build: import.meta.env.DEV ? 'development' : 'production',
  });

const locationSection = (): ReportRow[] => {
  const { href, pathname, search, hash } = window.location;
  return section('location', {
    url: href,
    path: pathname,
    query: search,
    hash,
  });
};

const productSection = (shell: Shell): ReportRow[] =>
  section('product', {
    id: shell.manifest.id,
    name: shell.manifest.name,
    slug: shell.manifest.navigation.slug,
    multiplayer: shell.manifest.multiplayer,
  });

const shellSection = (shell: Shell): ReportRow[] => {
  const annotations = () => {
    if (!shell.annotations) return 'off';
    return shell.annotations.isActive.value
      ? shell.annotations.mode.value
      : 'idle';
  };

  const onboarding = () => {
    if (!shell.onboarding) return 'off';
    return shell.onboarding.isActive.value ? 'open' : 'closed';
  };

  return section('shell', {
    lens: shell.lens.activeId.value ?? 'none',
    annotations: annotations(),
    onboarding: onboarding(),
    appearance: shell.appearance.state.value,
    'appearance setting': shell.appearance.value,
    // chrome hidden explains a report whose screenshot shows none of the shell
    'chrome hidden': shell.componentSlots.visibility.isHidden.value,
  });
};

const flagsSection = (shell: Shell): ReportRow[] =>
  Object.entries(shell.flags).map(([name, isOn]) => [
    'flags',
    name,
    format(isOn),
  ]);

const simulationSection = (shell: Shell): ReportRow[] => {
  const running = shell.simulation.current.value;
  if (!running) return section('simulation', { state: 'idle' });

  return section('simulation', {
    state: 'running',
    id: running.definition.id,
    frame: running.playhead.position + 1,
    // frameAt simulations generate on demand and so never declare an end
    frames: running.frameCount,
    guard: running.violation?.id ?? 'passing',
  });
};

const historySection = (shell: Shell): ReportRow[] => {
  const { history } = shell;
  if (!history) return section('history', { state: 'off' });

  return section('history', {
    state: 'on',
    'can undo': history.canUndo.value,
    'can redo': history.canRedo.value,
    blocked: history.suppression.value ?? 'no',
  });
};

const roomSection = (shell: Shell): ReportRow[] => {
  const { multiplayer } = shell;
  const room = multiplayer?.room.state.value;

  if (!room?.connected)
    return section('room', { state: multiplayer ? 'offline' : 'off' });

  return section('room', {
    state: 'connected',
    id: room.id,
    roster: Object.keys(room.userIdToRosterEntry).length,
    'here now': Object.keys(room.userIdToPresence).length,
    tier: room.me.tier,
    host: room.me.isHost,
    readonly: multiplayer?.room.isReadonly.value,
  });
};

/** the aggregator is a plain array behind a getter, so its counts are taken in one pass */
const countElements = (surface: CanvasSurface) => {
  const aggregator = surface.aggregator.aggregator();
  const countByShape = new Map<string, number>();
  let hitTestable = 0;

  for (const element of aggregator) {
    if (!element.paintOnly) hitTestable++;
    const { name } = element.shape;
    countByShape.set(name, (countByShape.get(name) ?? 0) + 1);
  }

  return { total: aggregator.length, hitTestable, countByShape };
};

const surfaceSection = (shell: Shell, sample: BugReportSample): ReportRow[] => {
  const { surface } = shell;
  const { total, hitTestable, countByShape } = countElements(surface);
  const { panX, panY, zoom } = surface.camera.state;
  const canvas = surface.canvas.value;
  const world = surface.visibleWorldRect.value;
  const cursor = surface.cursorCoordinates.value;

  const readings = section('surface', {
    fps: sample.fps,
    'frame ms': sample.frameMs.toFixed(2),
    elements: total,
    'hit testable': hitTestable,
    animating: surface.renderer.activeAnimations.size,
    zoom: zoom.value.toFixed(3),
    'pan x': round(panX.value),
    'pan y': round(panY.value),
    'canvas width': canvas?.clientWidth,
    'canvas height': canvas?.clientHeight,
    'canvas dpr':
      canvas && (canvas.width / (canvas.clientWidth || 1)).toFixed(2),
    'world x': round(world.at.x),
    'world y': round(world.at.y),
    'world width': round(world.width),
    'world height': round(world.height),
    'cursor x': cursor && round(cursor.x),
    'cursor y': cursor && round(cursor.y),
    'background pattern': surface.draw.backgroundPatternSuspended.value
      ? 'suspended'
      : 'drawn',
    content: surface.draw.contentSuspended.value ? 'suspended' : 'drawn',
  });

  // uncapped, unlike the panel's four rows: a report has the room the column does not
  const shapes: ReportRow[] = [...countByShape]
    .sort(([, previous], [, next]) => next - previous)
    .map(([name, count]) => ['shapes', name, format(count)]);

  return [...readings, ...shapes];
};

const slotsSection = (shell: Shell): ReportRow[] =>
  shell.componentSlots.entries.value.map(({ id, position }) => [
    'slots',
    id,
    position,
  ]);

const userAgentSection = (shell: Shell): ReportRow[] => {
  const { userAgent } = shell;
  const { parsed, screen } = userAgent;

  return section('user agent', {
    browser: parsed.browser,
    version: parsed.version,
    engine: parsed.engine,
    os: parsed.os,
    form: parsed.isMobile ? 'mobile' : 'desktop',
    'touch points': userAgent.touchPoints,
    'touch only': userAgent.isTouchOnly.value,
    cores: userAgent.cores,
    'memory gb': userAgent.deviceMemoryGb,
    'window width': userAgent.window.width.value,
    'window height': userAgent.window.height.value,
    'screen width': screen?.width,
    'screen height': screen?.height,
    'pixel ratio': userAgent.pixelRatio.value,
    language: userAgent.language,
    online: userAgent.isOnline.value,
    'reduced motion': userAgent.prefersReducedMotion.value,
    raw: userAgent.raw || UNKNOWN,
  });
};

/**
 * what the product is holding, as a link that reopens it. the one reading worth more
 * than every other one put together, since it is the difference between a report that
 * describes a bug and one that reproduces it
 */
const stateSection = (shell: Shell): ReportRow[] => {
  const { transit } = shell;
  if (!transit) return section('state', { transit: 'none' });

  try {
    const link = getLink(shell);
    if (link.success) return section('state', { link: link.link });

    // a link caps at what a url can carry; a report pasted into an issue does not, so
    // state too big to link travels as the encoding itself
    const payload = JSON.stringify(transit.encode());
    return section('state', {
      link: link.reason,
      chars: payload.length,
      payload:
        payload.length > MAX_PAYLOAD_CHARS ? 'too large to include' : payload,
    });
  } catch (err) {
    // a product that cannot encode itself is worth reporting, not worth failing over
    return section('state', { error: String(err) });
  }
};

/** frame timing as the panels sample it, which nothing readable off the shell carries */
export type BugReportSample = {
  fps: number;
  frameMs: number;
};

/** every reading the shell can take right now, as csv. see the notes at the top of this file */
export const buildBugReport = (shell: Shell, sample: BugReportSample): string =>
  toCsv([
    ...sessionSection(shell),
    ...locationSection(),
    ...productSection(shell),
    ...shellSection(shell),
    ...flagsSection(shell),
    ...simulationSection(shell),
    ...historySection(shell),
    ...roomSection(shell),
    ...surfaceSection(shell, sample),
    ...slotsSection(shell),
    ...userAgentSection(shell),
    ...stateSection(shell),
  ]);
