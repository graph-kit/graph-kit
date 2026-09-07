import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import type { DeepReadonly } from 'ts-essentials';

import type { SectionKey } from '../sectionKey.ts';
import type { SetDefinitionId } from '../types.ts';

const RESIZE_BAND_SUFFIX = '/resize';
const SECTION_PREFIX = 'section/';

/** which part of a set the pointer is on, since each is its own canvas element */
export type SetElementPart = 'body' | 'edge';

export const sectionElementId = (key: SectionKey) => `${SECTION_PREFIX}${key}`;

export const resizeBandElementId = (setId: SetDefinitionId) =>
  `${setId}${RESIZE_BAND_SUFFIX}`;

/**
 * the set a canvas element belongs to, or undefined for anything that is not
 * one. section fills are paint only, so they never reach here
 */
export const setElementIdentity = (
  element: DeepReadonly<CanvasElement> | undefined,
): { setId: SetDefinitionId; part: SetElementPart } | undefined => {
  if (!element) return;

  const { id } = element;
  if (id.startsWith(SECTION_PREFIX)) return;

  if (id.endsWith(RESIZE_BAND_SUFFIX)) {
    return { setId: id.slice(0, -RESIZE_BAND_SUFFIX.length), part: 'edge' };
  }

  return { setId: id, part: 'body' };
};
