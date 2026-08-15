import { CanvasProps } from '@canvas/surface/types';
import { BasicColorMode } from '@vueuse/core';
import * as Y from 'yjs';

import { ComputedRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { Graph } from '../graph/types.ts';
import { LensControls } from '../lens/useLensState.ts';
import { ProductMultiplayer } from '../multiplayer/types.ts';
import { ShortcutControls } from '../shortcuts/useShortcuts.ts';
import { SimulationControls } from '../simulation/useSimulationState.ts';
import { AnnotationsControls } from '../ui/annotations/useAnnotationsState.ts';
import { AppearanceControls } from '../ui/appearance/useProductAppearance.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';
import { UIControls, UIOptions } from '../ui/useProductUI.ts';
import { LocalStorageControls } from './internals/useLocalStorageSync.ts';
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
  /** makes whatever the graph holds right now the state undo bottoms out at */
  clear: () => void;
};

export type HostBinding = {
  history: HistoryField;
  /** stops mirroring, leaving the host's own state exactly as the document left it */
  unbind: () => void;
};

/**
 * everything the magic product harness needs in order to function
 */
export type MagicProductHost = {
  transit: TransitField;
  surface: CanvasProps;
  onAppearanceChanged: (color: BasicColorMode) => void;
  multiplayer: MultiplayerHostField;
  history?: HistoryField;
};

/**
 * The mapping between what a host holds and the room's document, in both directions. The
 * only thing that knows either shape, which is what keeps the document out of the harness
 * and the room out of the product.
 *
 * Separate from {@link TransitField} because the document's shape is not transit's, and
 * adopting one can mean more than writing it (stopping a simulation, dropping a lens).
 */
export type MultiplayerHostField = {
  /**
   * Ties the host to the room's document for as long as the product is mounted, mirroring
   * changes both ways from then on.
   *
   * An empty document means nobody has opened this product in the room yet, so the host
   * seeds it from what it already holds. Otherwise the document is authoritative and the
   * host adopts it, discarding local state.
   *
   * Answers with the binding it made: undo over the document, which the harness swaps in
   * for as long as the room owns the product, and the teardown that lets a later join
   * rebind onto a different document.
   */
  bind: (doc: Y.Doc) => HostBinding | undefined;
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
  /** opt in to local storage, exposing {@link Magic.localStorage} for the host to drive */
  localStorage?: boolean;
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
  localStorage: LocalStorageControls;
  /**
   * The room connection, or undefined if
   * 1. product has opted-out of multiplayer in its manifest or
   * 2. no server is configured or
   * 3. during prerender
   */
  multiplayer?: ProductMultiplayer;
};
