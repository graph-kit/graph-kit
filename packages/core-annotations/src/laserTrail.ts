import type { Coordinate } from '@canvas/primitives/types/utility';

/** a point of the trail, carrying the moment the pointer was there */
export type TrailPoint = Coordinate & { at: number };

const distance = (a: Coordinate, b: Coordinate) =>
  Math.hypot(b.x - a.x, b.y - a.y);

const lerp = (a: TrailPoint, b: TrailPoint, t: number): TrailPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  at: a.at + (b.at - a.at) * t,
});

export const trailLength = (trail: TrailPoint[]) => {
  let total = 0;
  for (let i = 1; i < trail.length; i++)
    total += distance(trail[i - 1], trail[i]);
  return total;
};

/**
 * walks from the head of the trail to `to` planting a point every `spacing` units, so the
 * trail is made of segments of one size no matter how far the pointer jumped between two
 * samples. a fast drag samples sparsely, and without this the trail is a handful of long
 * chords that read as choppy and vanish a whole limb at a time when they decay.
 */
export const appendResampled = (
  trail: TrailPoint[],
  to: TrailPoint,
  spacing: number,
) => {
  const last = trail.at(-1);
  if (!last) {
    trail.push(to);
    return;
  }

  const span = distance(last, to);
  if (span < spacing) return;

  const steps = Math.floor(span / spacing);
  for (let step = 1; step <= steps; step++) {
    trail.push(lerp(last, to, (step * spacing) / span));
  }
};

/**
 * drops everything the pointer laid down before `cutoff`, cutting partway into a segment
 * rather than only at a point, which is what keeps the tail sliding smoothly instead of
 * stepping. holding the trail by age rather than by size is what gives a fast drag a long
 * tail and a slow one a short tail: the trail is always the same span of motion.
 */
export const trimOlderThan = (trail: TrailPoint[], cutoff: number) => {
  const head = trail.at(-1);
  // once the newest point is past the cutoff there is no motion left to hold
  if (!head || head.at < cutoff) {
    trail.length = 0;
    return;
  }

  for (let i = trail.length - 1; i > 0; i--) {
    if (trail[i - 1].at >= cutoff) continue;

    const span = trail[i].at - trail[i - 1].at;
    // a zero span segment cannot be cut into, so keep the younger end whole
    const cut =
      span > 0
        ? lerp(trail[i - 1], trail[i], (cutoff - trail[i - 1].at) / span)
        : trail[i];
    trail.splice(0, i, cut);
    return;
  }
};

/**
 * a hard stop on how much trail a single flick can put on screen. the age window is what
 * shapes the tail; this only keeps a violent drag from painting the whole canvas.
 */
export const trimToLength = (trail: TrailPoint[], maxLength: number) => {
  if (maxLength <= 0) {
    trail.length = 0;
    return;
  }

  let remaining = maxLength;
  // walk back from the head of the trail (the newest point) to find where the budget runs out
  for (let i = trail.length - 1; i > 0; i--) {
    const segment = distance(trail[i - 1], trail[i]);

    if (segment <= remaining) {
      remaining -= segment;
      continue;
    }

    const cut = lerp(trail[i], trail[i - 1], remaining / segment);
    trail.splice(0, i, cut);
    return;
  }
};

/**
 * splits the trail into `count` runs from tail to head, each sharing a point with the next
 * so the runs paint as one continuous stroke. drawn at rising brush weights, this is what
 * tapers the trail into the cursor instead of ending it in a flat stub.
 */
export const taperRuns = (trail: TrailPoint[], count: number) => {
  if (trail.length < 2) return [];

  const runs: TrailPoint[][] = [];
  const perRun = (trail.length - 1) / count;

  for (let run = 0; run < count; run++) {
    const from = Math.floor(run * perRun);
    const to = Math.floor((run + 1) * perRun);
    if (to - from < 1) continue;
    runs.push(trail.slice(from, to + 1));
  }

  return runs;
};
