import { nullThrows } from '@core/utils/assert';

import type { SetDefinition, SetDefinitionId, SetDisplay } from './types.ts';

export const getSetDefinition = (
  definitions: SetDefinition[],
  id: SetDefinitionId,
) => {
  const definition = definitions.find((candidate) => candidate.id === id);
  return nullThrows(definition, `no set definition with id ${id}`);
};

/**
 * whether two circles have any area in common, which is what makes a section
 * of the set space worth enumerating. this is partition data, not a hit test:
 * what the pointer is over comes from the aggregator
 */
export const isOverlapping = (display1: SetDisplay, display2: SetDisplay) => {
  const dx = display2.at.x - display1.at.x;
  const dy = display2.at.y - display1.at.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < display1.radius + display2.radius;
};
