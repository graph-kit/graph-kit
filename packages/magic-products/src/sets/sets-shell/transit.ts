import type { CanvasSurface } from '@canvas/surface/types';
import type { Annotation, AnnotationsControls } from '@core/annotations/index';
import { generateId } from '@core/utils/id';
import type { TransitField } from '@magic/shared/product';

import type { EncodedQuery, Queries } from '../queries.ts';
import type { SetDefinitions } from '../setDefinitions.ts';

/** a set stripped to what survives a reload, flattened so a codec has nothing to walk */
export type EncodedSet = {
  label: string;
  x: number;
  y: number;
  radius: number;
};

/**
 * The half of sets a room carries and history steps through: the circles and what has
 * been drawn over them.
 */
export type SetsSharedState = {
  sets: EncodedSet[];
  annotations: Annotation[];
};

/** what sets serializes. shared and what stays on device */
export type SetsTransitPayload = SetsSharedState & {
  queries: EncodedQuery[];
  camera: { panX: number; panY: number; zoom: number };
};

export type SetsTransitParts = {
  sets: SetDefinitions;
  queries: Queries;
  annotations: AnnotationsControls;
  surface: CanvasSurface;
};

const encodeSets = (sets: SetDefinitions): EncodedSet[] =>
  sets.definitions.value.map(({ label, display }) => ({
    label,
    x: display.at.x,
    y: display.at.y,
    radius: display.radius,
  }));

const decodeSets = (sets: SetDefinitions, encoded: EncodedSet[]) =>
  sets.setAll(
    encoded.map(({ label, x, y, radius }) => ({
      id: generateId(),
      label,
      display: { at: { x, y }, radius },
    })),
  );

const encodeQueries = (queries: Queries): EncodedQuery[] =>
  queries.queries.value.map(({ latexQueryString, hidden, color }) => ({
    latexQueryString,
    hidden,
    color,
  }));

export const createSetsTransit = ({
  sets,
  queries,
  annotations,
  surface,
}: SetsTransitParts): TransitField => ({
  encode: (): SetsTransitPayload => {
    const { panX, panY, zoom } = surface.camera.state;
    return {
      sets: encodeSets(sets),
      annotations: annotations.annotations(),
      queries: encodeQueries(queries),
      camera: { panX: panX.value, panY: panY.value, zoom: zoom.value },
    };
  },

  decode: (payload: Partial<SetsTransitPayload>) => {
    // every write below drops what it cannot use, so a payload missing a key restores
    // the rest of itself rather than nothing
    decodeSets(sets, payload.sets ?? []);
    annotations.setAll(payload.annotations ?? []);
    queries.setAll(payload.queries ?? []);

    if (!payload.camera) return;
    const { panX, panY, zoom } = surface.camera.state;
    panX.value = payload.camera.panX;
    panY.value = payload.camera.panY;
    zoom.value = payload.camera.zoom;
  },
});
