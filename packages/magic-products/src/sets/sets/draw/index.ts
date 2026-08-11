import type { Section, SetDefinition } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';
import type { SetFocusControls } from '../composables/useSetFocus.ts';
import type { SectionKey } from '../other/sectionKey.ts';
import {
  DrawSetDefinitionCircleOptions,
  drawCircleStroke,
  drawCircleTextLabel,
} from './circles.ts';
import { colorSections } from './colorSections.ts';

type DrawProps = {
  /** every set to draw, as a circle with its label */
  definitions: SetDefinition[];
  /** every atomic region of the set space, painted where highlighted */
  sections: Section[];
  /** colors painted over a section, keyed by the sets forming it */
  sectionKeyToColors: Map<SectionKey, string[]>;
  /** whether a set carries the focus outline, see {@link SetFocusControls} */
  isSetFocused: SetFocusControls['isFocused'];
};

export const draw = (
  ctx: CanvasRenderingContext2D,
  props: DrawProps,
  colors: SetColors,
) => {
  colorSections(ctx, props);

  for (const setDefinition of props.definitions) {
    const options: DrawSetDefinitionCircleOptions = {
      setDefinition,
      isFocused: props.isSetFocused(setDefinition.id),
      ctx,
      colors,
    };
    drawCircleStroke(options);
    drawCircleTextLabel(options);
  }
};
