import { nullThrows } from '@core/utils/assert';

import type { Shape } from '../../types/index.ts';
import { circle } from '../circle/index.ts';
import { ellipse } from '../ellipse/index.ts';
import { rect } from '../rect/index.ts';
import { square } from '../square/index.ts';
import { triangle } from '../triangle/index.ts';
import type { RegionMember, RegionMemberName } from './types.ts';

const MEMBER_FACTORIES: Record<RegionMemberName, (schema: any) => Shape> = {
  circle,
  ellipse,
  rect,
  square,
  triangle,
};

/**
 * the member as a shape, stripped of everything that is paint rather than
 * geometry. the stroke matters most: `ellipseHitbox` grows the hitbox by half
 * the stroke width, so a member that kept one would hit test a larger shape
 * than it clips
 */
export const memberShape = (member: RegionMember): Shape => {
  const { shape: name, ...geometry } = member;

  const factory = nullThrows(
    MEMBER_FACTORIES[name],
    `"${name}" cannot be a region member`,
  );

  return factory({
    ...geometry,
    stroke: undefined,
    textArea: undefined,
    fillColor: undefined,
  });
};
