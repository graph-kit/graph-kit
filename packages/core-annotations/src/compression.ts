import type { Coordinate } from '@canvas/primitives/types/utility';
import { assert, nullThrows } from '@core/utils/assert';
import { generateId } from '@core/utils/id';

import type { Annotation } from './types.ts';

const VERSION = '1';

const SECTION = '|';
const RECORD = ';';
const FIELD = ',';

const typeToToken: Record<Annotation['type'], string> = {
  draw: 'd',
  erase: 'e',
};

const tokenToType: Record<string, Annotation['type'] | undefined> = {
  d: 'draw',
  e: 'erase',
};

const toNumber = (field: string | undefined) => {
  const value = Number(field);
  assert(
    field && Number.isFinite(value),
    `annotations: "${field}" is not a number`,
  );
  return value;
};

const compressPoints = (points: Coordinate[]) => {
  const fields: string[] = [];

  let previousX = 0;
  let previousY = 0;

  for (const point of points) {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    if (fields.length > 0 && x === previousX && y === previousY) continue;

    fields.push(String(x - previousX), String(y - previousY));
    previousX = x;
    previousY = y;
  }

  return fields;
};

const decompressPoints = (fields: string[]) => {
  assert(
    fields.length % 2 === 0,
    'annotations: a point is missing half of itself',
  );

  const points: Coordinate[] = [];

  let x = 0;
  let y = 0;

  for (let i = 0; i < fields.length; i += 2) {
    x += toNumber(fields[i]);
    y += toNumber(fields[i + 1]);
    points.push({ x, y });
  }

  return points;
};

const colorTable = (annotations: Annotation[]) => {
  const colors: string[] = [];

  for (const { fillColor } of annotations) {
    if (fillColor === undefined || colors.includes(fillColor)) continue;
    colors.push(fillColor);
  }

  return colors;
};

export const compressAnnotations = (annotations: Annotation[]) => {
  const colors = colorTable(annotations);

  const strokes = annotations.map(({ type, fillColor, brushWeight, points }) =>
    [
      typeToToken[type],
      fillColor === undefined ? '' : String(colors.indexOf(fillColor)),
      brushWeight === undefined ? '' : String(brushWeight),
      ...compressPoints(points),
    ].join(FIELD),
  );

  const encodedColors = colors.map(encodeURIComponent).join(FIELD);

  return [VERSION, encodedColors, strokes.join(RECORD)].join(SECTION);
};

/**
 * Rebuilds what {@link compressAnnotations} was given.
 * @throws if it cannot parse.
 */
export const decompressAnnotations = (text: string): Annotation[] => {
  const [version, encodedColors, encodedStrokes] = text.split(SECTION);

  assert(version === VERSION, `annotations: cannot read version "${version}"`);

  const colors = encodedColors
    ? encodedColors.split(FIELD).map(decodeURIComponent)
    : [];

  if (!encodedStrokes) return [];

  return encodedStrokes.split(RECORD).map((stroke) => {
    const [token, colorIndex, brushWeight, ...points] = stroke.split(FIELD);

    return {
      id: generateId(),
      type: nullThrows(
        tokenToType[token ?? ''],
        `annotations: "${token}" is not a stroke type`,
      ),
      points: decompressPoints(points),
      fillColor: colorIndex
        ? nullThrows(
            colors[toNumber(colorIndex)],
            `annotations: no color at index ${colorIndex}`,
          )
        : undefined,
      brushWeight: brushWeight ? toNumber(brushWeight) : undefined,
    };
  });
};
