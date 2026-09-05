import {
  compressAnnotations,
  decompressAnnotations,
} from '@core/annotations/index';
import { assert } from '@core/utils/assert';
import type { TransitCompression } from '@magic/shared/product';

import { QUERY_COLORS } from '../constants.ts';
import type { SetsTransitPayload } from './transit.ts';

const VERSION = '1';

const SECTION = '|';
const RECORD = ';';
const FIELD = ',';

/** version, camera, sets, queries, annotations */
const SECTION_COUNT = 5;

const CAMERA_PRECISION = 100;

const round = (value: number, precision = 1) =>
  Math.round(value * precision) / precision;

const toNumber = (field: string | undefined) => {
  const value = Number(field);
  assert(
    field && Number.isFinite(value),
    `sets transit: "${field}" is not a number`,
  );
  return value;
};

/**
 * leaves the last section whole, so annotations can bring their own separators through
 * rather than being escaped, which would undo most of what compressing them just saved
 */
const splitSections = (text: string) => {
  const sections: string[] = [];

  let rest = text;
  for (let index = 0; index < SECTION_COUNT - 1; index++) {
    const at = rest.indexOf(SECTION);
    assert(
      at !== -1,
      `sets transit: the payload is cut short at section ${index + 1}`,
    );
    sections.push(rest.slice(0, at));
    rest = rest.slice(at + 1);
  }

  sections.push(rest);
  return sections;
};

const records = (section: string) =>
  section ? section.split(RECORD).map((record) => record.split(FIELD)) : [];

const compress = (payload: SetsTransitPayload) => {
  const { sets, queries, annotations, camera } = payload;

  const cameraFields = [camera.panX, camera.panY, camera.zoom]
    .map((value) => round(value, CAMERA_PRECISION))
    .join(FIELD);

  // labels come from ALPHABET, so they never need escaping
  const setFields = sets.map(({ label, x, y, radius }) =>
    [label, round(x), round(y), round(radius)].join(FIELD),
  );

  const queryFields = queries.map(({ latexQueryString, hidden, color }) => {
    const colorIndex = QUERY_COLORS.indexOf(color);
    return [
      colorIndex === -1 ? 0 : colorIndex,
      hidden ? 1 : 0,
      // latex is whatever the user typed, which includes every separator here
      encodeURIComponent(latexQueryString),
    ].join(FIELD);
  });

  return [
    VERSION,
    cameraFields,
    setFields.join(RECORD),
    queryFields.join(RECORD),
    compressAnnotations(annotations),
  ].join(SECTION);
};

const decompress = (text: string): SetsTransitPayload => {
  const [version, camera, sets, queries, annotations] = splitSections(text);

  assert(version === VERSION, `sets transit: cannot read version "${version}"`);

  const [panX, panY, zoom] = (camera ?? '').split(FIELD);

  return {
    sets: records(sets ?? '').map(([label, x, y, radius]) => ({
      label: label ?? '',
      x: toNumber(x),
      y: toNumber(y),
      radius: toNumber(radius),
    })),

    queries: records(queries ?? '').map(([colorIndex, hidden, latex]) => ({
      color: QUERY_COLORS[toNumber(colorIndex)] ?? QUERY_COLORS[0],
      hidden: hidden === '1',
      latexQueryString: decodeURIComponent(latex ?? ''),
    })),

    annotations: decompressAnnotations(annotations ?? ''),

    camera: {
      panX: toNumber(panX),
      panY: toNumber(panY),
      zoom: toNumber(zoom),
    },
  };
};

export const setsTransitCompression: TransitCompression = {
  compress,
  decompress,
};
