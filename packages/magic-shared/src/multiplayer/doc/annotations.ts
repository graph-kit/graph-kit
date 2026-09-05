import { Coordinate } from '@canvas/surface/types';
import { Annotation } from '@core/annotations/index';
import * as Y from 'yjs';

/**
 * The room's view of an annotation, keyed by its id. Everything an annotation is except
 * the id and the type, which is always a draw: an erased stroke leaves the map rather
 * than staying in it as an erasure.
 */
export type DocAnnotation = {
  points: Coordinate[];
  fillColor?: string;
  brushWeight?: number;
};

export const readAnnotationsMap = (doc: Y.Doc) =>
  doc.getMap<DocAnnotation>('annotations');

export const annotationToDoc = ({
  points,
  fillColor,
  brushWeight,
}: Annotation): DocAnnotation => ({ points, fillColor, brushWeight });

export const annotationFromDoc = (
  id: string,
  annotation: DocAnnotation,
): Annotation => ({ id, type: 'draw', ...annotation });
