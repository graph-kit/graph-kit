import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import type { AnimatedShapeFactories } from '@canvas/primitives/animation/index';
import type { RegionMember } from '@canvas/primitives/shapes/region/types';
import { CANVAS_ELEMENT_CURSOR_FIELD_KEY } from '@canvas/surface/cursor';
import type { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import type { Color } from '@core/utils/colors';
import { CURSOR } from '@core/utils/cursor';

import type { SetFocusControls } from '../composables/useSetFocus.ts';
import { EDGE_GRAB_BUFFER } from '../constants.ts';
import { type SectionKey, getSectionKey } from '../sectionKey.ts';
import type { SetsTheme } from '../theme/useSetsTheme.ts';
import type { Section, SetDefinition } from '../types.ts';
import { resizeBandElementId, sectionElementId } from './elementIdentity.ts';

/*
  three tiers, low to high: the section fills nobody can touch, the circles, and
  the resize bands, which have to win the pointer over the circle they straddle
*/
const SECTION_PRIORITY = 0;
const CIRCLE_PRIORITY = 1;
const RESIZE_BAND_PRIORITY = 2;

export type SetsCanvasElementsProps = {
  /** every set to draw, as a circle with its label */
  definitions: SetDefinition[];
  /** every atomic region of the set space, painted where highlighted */
  sections: Section[];
  /** colors painted over a section, keyed by the sets forming it */
  sectionKeyToColors: Map<SectionKey, Color[]>;
  /** whether a set carries the focus outline, see {@link SetFocusControls} */
  isSetFocused: SetFocusControls['isFocused'];
  /** the area to paint within, which every clip is taken against */
  bounds: BoundingBox;
  /** where the pointer is, which is what aims a resize arrow */
  cursorAt: Coordinate;
  /** whether a set is being dragged right now, for grab versus grabbing */
  isGrabbing: boolean;
  shapes: AnimatedShapeFactories;
  resolveToken: SetsTheme['_resolveToken'];
};

const asMember = ({ display }: SetDefinition): RegionMember => ({
  shape: 'circle',
  ...display,
});

/**
 * the smallest circle wins the pointer, and the aggregator hands its elements
 * back to front, so the smallest has to be pushed last
 */
const byDescendingRadius = (previous: SetDefinition, next: SetDefinition) =>
  next.display.radius - previous.display.radius;

/**
 * one region per highlighted section, clipped to exactly the area inside every
 * set forming it and outside every other. a section nothing selects is left
 * unpainted, so the canvas shows through
 */
const sectionElements = (props: SetsCanvasElementsProps): CanvasElement[] => {
  const { sections, definitions, sectionKeyToColors, bounds, shapes } = props;

  const stripeWidth = props.resolveToken('section.stripeWidth');
  const elements: CanvasElement[] = [];

  for (const section of sections) {
    const key = getSectionKey(section);
    const colors = sectionKeyToColors.get(key);
    if (!colors) continue;

    const inside: RegionMember[] = [];
    const outside: RegionMember[] = [];

    for (const definition of definitions) {
      const side = section.includes(definition.id) ? inside : outside;
      side.push(asMember(definition));
    }

    const id = sectionElementId(key);

    elements.push({
      id,
      priority: SECTION_PRIORITY,
      // a fill is scenery: the pointer lands on whatever sits beneath it
      paintOnly: true,
      shape: shapes.region({
        id,
        inside,
        outside,
        bounds,
        fillHatch: { colors, stripeWidth },
      }),
    });
  }

  return elements;
};

const circleElements = (props: SetsCanvasElementsProps): CanvasElement[] => {
  const { definitions, isSetFocused, shapes, resolveToken, isGrabbing } = props;

  return definitions.toSorted(byDescendingRadius).map((definition) => ({
    id: definition.id,
    priority: CIRCLE_PRIORITY,
    data: {
      [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: isGrabbing
        ? CURSOR.GRABBING
        : resolveToken('set.cursor'),
    },
    shape: shapes.circle({
      id: definition.id,
      ...definition.display,
      stroke: {
        color: isSetFocused(definition.id)
          ? resolveToken('set.outline.focused.color')
          : resolveToken('set.outline.color'),
        lineWidth: resolveToken('set.outline.width'),
      },
      textArea: {
        id: definition.id,
        textBlock: {
          content: definition.label,
          fontSize: resolveToken('set.label.size'),
          fontWeight: resolveToken('set.label.fontWeight'),
          color: resolveToken('set.label.color'),
        },
      },
    }),
  }));
};

/**
 * which way a resize arrow points: shallow off the centre reads as horizontal,
 * steep as vertical
 */
const DIAGONAL_RADIANS = 0.75;

const resizeCursor = (at: Coordinate, cursorAt: Coordinate) => {
  const angle = Math.atan2(
    Math.abs(cursorAt.y - at.y),
    Math.abs(cursorAt.x - at.x),
  );
  return angle > DIAGONAL_RADIANS ? CURSOR.NS_RESIZE : CURSOR.EW_RESIZE;
};

/**
 * an unpainted annulus straddling each circle's edge. it exists to be grabbed:
 * the buffer either side is what makes an 8px outline a resize target
 */
const resizeBandElements = (
  props: SetsCanvasElementsProps,
): CanvasElement[] => {
  const { definitions, bounds, shapes, cursorAt } = props;

  return definitions.toSorted(byDescendingRadius).map((definition) => {
    const { at, radius } = definition.display;
    const id = resizeBandElementId(definition.id);

    return {
      id,
      priority: RESIZE_BAND_PRIORITY,
      data: {
        [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: resizeCursor(at, cursorAt),
      },
      shape: shapes.region({
        id,
        inside: [{ shape: 'circle', at, radius: radius + EDGE_GRAB_BUFFER }],
        outside: [{ shape: 'circle', at, radius: radius - EDGE_GRAB_BUFFER }],
        bounds,
      }),
    };
  });
};

export const setsCanvasElements = (
  props: SetsCanvasElementsProps,
): CanvasElement[] => [
  ...sectionElements(props),
  ...circleElements(props),
  ...resizeBandElements(props),
];
