import { CanvasProps } from '@canvas/surface/types';
import { BasicColorMode } from '@vueuse/core';

import { ComputedRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { Graph } from '../graph/types.ts';
import { UseGraphOptions } from '../graph/useGraph.ts';
import { LensControls } from '../lens/useLensState.ts';
import { ShortcutControls } from '../shortcuts/useShortcuts.ts';
import { SimulationControls } from '../simulation/useSimulationState.ts';
import { AnnotationsControls } from '../ui/annotations/useAnnotationsState.ts';
import { AppearanceControls } from '../ui/appearance/useProductAppearance.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';
import { UIControls, UIOptions } from '../ui/useProductUI.ts';
import { ProductId } from './manifests/index.ts';
import { MagicProductManifest } from './manifests/types.ts';

export type TransitField = {
  encode: () => any;
  decode: (payload: any) => void;
};

export type HistoryField = {
  canRedo: ComputedRef<boolean>;
  canUndo: ComputedRef<boolean>;
  undo: () => void;
  redo: () => void;
};

/**
 * everything the harness needs from whatever it is hosting. a graph satisfies
 * this, but so does anything else that can paint to a canvas and describe its
 * own state, which is what lets non graph products run in the same shell
 */
export type MagicProductHost = {
  transit: TransitField;
  surface: CanvasProps;
  setAppearance: (color: BasicColorMode) => void;
  history?: HistoryField;
};

export type MagicProductOptions = {
  productId: ProductId;
  /**
   * the canvas annotations draw onto. a handle rather than a boolean because
   * only the graph canvas carries the aggregator and cursor annotations need.
   * moving the capability onto {@link MagicProductHost} is tracked in
   * https://github.com/graph-kit/graph-kit/issues/846
   */
  annotations?: Graph['canvas'];
  lensChips?: LensChipDefinition[];
  ui?: UIOptions;
  /** provide a handler for the trigger save function if you want to opt-in to local storage  */
  localStorage?: (triggerSave: () => void) => void;
};

/** the harness itself: the chrome and controls wrapped around a hosted product */
export type Magic = {
  manifest: MagicProductManifest;
  lens: LensControls;
  componentSlots: ComponentSlotControls;
  simulation: SimulationControls;
  ui: UIControls;
  appearance: AppearanceControls;
  shortcuts: ShortcutControls;
  surface: CanvasProps;
  transit: TransitField;
  history?: HistoryField;
  annotations?: AnnotationsControls;
  lensChips?: LensChipDefinition[];
};

export type GraphLensChipOption = (
  graph: Graph,
) => LensChipDefinition[] | undefined;

export type GraphProductOptions = UseGraphOptions & {
  productId: ProductId;
  localStorage?: boolean;
  annotations?: boolean;
  lensChips?: GraphLensChipOption;
  ui?: UIOptions;
};

export type MagicGraph = Graph & {
  magic: Magic;
};
