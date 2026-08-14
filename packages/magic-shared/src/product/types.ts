import { CanvasProps } from '@canvas/surface/types';
import { PatchOp, ServerState } from '@multiplayer/protocol/server-state';
import { BasicColorMode } from '@vueuse/core';

import { ComputedRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { Graph } from '../graph/types.ts';
import { LensControls } from '../lens/useLensState.ts';
import { MultiplayerControls } from '../multiplayer/types.ts';
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
};

/**
 * everything the magic product harness needs in order to function
 */
export type MagicProductHost = {
  transit: TransitField;
  surface: CanvasProps;
  onAppearanceChanged: (color: BasicColorMode) => void;
  // `any` so a host can narrow State at its definition site: pinning this to
  // ServerState makes the contextual type for onForceResync's parameter ServerState
  // too, and the narrowing validate exists to provide is lost. provisional until the
  // singleton settles what shape this field actually needs.
  multiplayer: MultiplayerHostField<any>;
  history?: HistoryField;
};

/**
 * The mapping between what a host holds and what the room stores, in both directions,
 * plus how the host takes a change on. The only thing that knows either shape, which is
 * what keeps the room shape out of the harness and the harness out of the product.
 *
 * Separate from {@link TransitField} because the room's shape is not transit's, and
 * adopting state can mean more than writing it (stopping a simulation, dropping a lens).
 *
 * Methods rather than function properties on purpose: validate gates every call, so
 * narrowing State is sound by construction and worth the bivariance.
 */
export type MultiplayerHostField<State extends ServerState = ServerState> = {
  /** current local state as the room stores it, for seeding, force pushes and drift checks */
  encode: () => State;
  /** false is an invariant violation, not a case to handle */
  validate: (state: ServerState) => state is State;
  /** adopt wholesale, for a join, a product handoff and a drift resync alike */
  onForceResync(state: State): void;
  /** throwing leaves a version gap the next relay turns into a resync */
  applyOps(ops: PatchOp[]): void;
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
  multiplayer?: MultiplayerControls;
};
