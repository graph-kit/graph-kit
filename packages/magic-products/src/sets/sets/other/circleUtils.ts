import { nullThrows } from '@core/utils/assert';

import type {
  SetDefinition,
  SetDefinitionId,
  SetDisplay,
} from '../../types.ts';

export const getSetDefinition = (
  definitions: SetDefinition[],
  id: SetDefinitionId,
) => {
  const definition = definitions.find((candidate) => candidate.id === id);
  return nullThrows(definition, `no set definition with id ${id}`);
};

export const isInsideCircle = (x: number, y: number, display: SetDisplay) => {
  const dx = x - display.at.x;
  const dy = y - display.at.y;
  return dx * dx + dy * dy <= display.radius * display.radius;
};

export const isOnEdge = (x: number, y: number, display: SetDisplay) => {
  const dx = x - display.at.x;
  const dy = y - display.at.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  // due to the 10 px buffer, both `isInsideCircle` and `isOnEdge`
  // can be true at the same time
  return Math.abs(distance - display.radius) < 10;
};

export const isOverlapping = (display1: SetDisplay, display2: SetDisplay) => {
  const dx = display2.at.x - display1.at.x;
  const dy = display2.at.y - display1.at.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < display1.radius + display2.radius;
};
