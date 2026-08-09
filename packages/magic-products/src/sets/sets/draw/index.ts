import type { Overlap, SetDefinition, SetDefinitionId } from '../../types.ts';
import type { CircleFocusControls } from '../composables/useCircleFocus.ts';
import {
  drawCircleBackground,
  drawCircleLabel,
  drawCircleOutline,
} from './circles.ts';
import { colorOverlappingAreas } from './overlaps.ts';

type DrawProps = {
  definitions: SetDefinition[];
  overlaps: Overlap[];
  highlightedSets: Map<SetDefinitionId, string[]>;
  highlightedOverlaps: Map<Overlap['id'], string[]>;
  isSetFocused: CircleFocusControls['isSetFocused'];
  backgroundColors: string[] | null;
};

export const draw = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
  const { highlightedSets, highlightedOverlaps } = props;

  for (const set of props.definitions) {
    drawCircleBackground(ctx, {
      set,
      highlightColors: highlightedSets.get(set.id) ?? null,
    });
  }

  colorOverlappingAreas(ctx, {
    definitions: props.definitions,
    overlaps: props.overlaps,
    highlightedSets,
    highlightedOverlaps,
  });

  for (const set of props.definitions) {
    const options = {
      set,
      isFocused: props.isSetFocused(set.id),
    };
    drawCircleOutline(ctx, options);
    drawCircleLabel(ctx, options);
  }
};
