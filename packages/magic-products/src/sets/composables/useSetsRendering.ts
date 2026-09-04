import type {
  Aggregator,
  AggregatorTransformer,
} from '@canvas/primitives/aggregator/types';
import type { CanvasSurface } from '@canvas/surface/types';
import type { Color } from '@core/utils/colors';

import { type ComputedRef, type Ref, computed, onBeforeUnmount } from 'vue';

import { setsCanvasElements } from '../draw/canvasElements.ts';
import type { Queries } from '../queries.ts';
import { type SectionKey, getSectionKey } from '../sectionKey.ts';
import type { SetDefinitions } from '../setDefinitions.ts';
import type { SetsTheme } from '../theme/useSetsTheme.ts';
import type { QueryId, Section } from '../types.ts';
import type { SetFocusControls } from './useSetFocus.ts';

type SetsRenderingProps = {
  surface: CanvasSurface;
  sets: SetDefinitions;
  queries: Queries;
  sections: ComputedRef<Section[]>;
  queryIdToSections: ComputedRef<Map<QueryId, Section[]>>;
  focus: SetFocusControls;
  theme: SetsTheme;
  /** whether a set is being dragged, which is the only thing grabbing means */
  isGrabbing: Ref<boolean>;
};

/**
 * everything sets puts on the canvas, as one aggregator transformer. it reads
 * its sources per frame rather than rebuilding on change, so nothing has to
 * know when a set moved
 */
export const useSetsRendering = (props: SetsRenderingProps) => {
  const { surface, sets, queries, queryIdToSections } = props;

  const sectionKeyToColors = computed(() => {
    const map = new Map<SectionKey, Color[]>();

    for (const [queryId, querySections] of queryIdToSections.value) {
      // the eye-toggle in Query hides a query's paint without touching whether it resolves
      const { hidden, color } = queries.getQuery(queryId);
      if (hidden) continue;

      for (const section of querySections) {
        const key = getSectionKey(section);
        const existing = map.get(key) ?? [];
        existing.push(color);
        map.set(key, existing);
      }
    }

    return map;
  });

  const transformer: AggregatorTransformer = (aggregator: Aggregator) => {
    aggregator.push(
      ...setsCanvasElements({
        definitions: sets.definitions.value,
        sections: props.sections.value,
        sectionKeyToColors: sectionKeyToColors.value,
        isSetFocused: props.focus.isFocused,
        bounds: surface.visibleWorldRect.value,
        cursorAt: surface.cursorCoordinates.value,
        isGrabbing: props.isGrabbing.value,
        shapes: surface.shapes,
        resolveToken: props.theme._resolveToken,
      }),
    );
    return aggregator;
  };

  surface.aggregator.addTransformer(transformer);

  onBeforeUnmount(() => surface.aggregator.removeTransformer(transformer));
};
