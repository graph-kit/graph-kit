import { CanvasProps } from '@canvas/surface/types';
import { PatchOp, ServerState } from '@multiplayer/protocol/server-state';
import { BasicColorMode } from '@vueuse/core';

import { ComputedRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { Graph } from '../graph/types.ts';
import { UseGraphOptions } from '../graph/useGraph.ts';
import { LensControls } from '../lens/useLensState.ts';
import { MultiplayerControls } from '../multiplayer/createMultiplayer.ts';
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

export type LocalStorageField = {
  /**
   * Reports that the hosted product's state changed, persisting it on a
   * debounce. A no-op when local storage was not opted into.
   */
  invalidate: () => void;
  /**
   * Restores whatever was persisted. Called by the harness rather than on mount,
   * because a room's state has to win over it and only the harness knows whether
   * one answered.
   */
  sync: () => void;
};

/**
 * everything the harness needs from whatever it is hosting. a graph satisfies
 * this, but so does anything else that can paint to a canvas and describe its
 * own state, which is what lets non graph products run in the same shell
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
 * What the harness needs from a host to keep it in sync with the room. Mirrors the
 * split {@link TransitControls} already makes: the host says whether state is its own,
 * and separately how to take it on. It never decides what a failed check *means*, since
 * only the multiplayer layer knows the productId, version and room it arrived under.
 */
export type MultiplayerHostField<State extends ServerState = ServerState> = {
  /**
   * Whether this server state belongs to this product. A false is an invariant
   * violation rather than a recoverable case, reachable only through state routed
   * under the wrong productId or a product encoding a shape it does not own, and the
   * multiplayer layer is what reports and recovers from it.
   */
  validate: (state: ServerState) => state is State;
  /**
   * Adopt authoritative state wholesale, discarding whatever is on screen. The single
   * inbound path for a room join, a product handoff and a drift resync alike, since all
   * three mean the same thing. Only ever called with state that passed {@link validate}.
   *
   * Not expressed as {@link TransitField.decode} because the room's shape is not
   * transit's, so denormalizing it is the host's job, and because adopting state may
   * mean more than writing it (stopping a simulation, dropping a lens) which a raw
   * decode gives nowhere to do.
   *
   * Declared method style on purpose: validate gates every call, so narrowing State
   * here is sound by construction and worth the bivariance.
   */
  onForceResync(state: State): void;
  /**
   * Apply an incoming change from a peer, by making the same mutation the local action
   * would have made. Throwing is a legitimate outcome: the version only advances once
   * this returns, so a failure leaves a gap the next relay turns into a resync.
   */
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
  localStorage: LocalStorageField;
  /**
   * The room connection, or undefined when this product has not opted into
   * multiplayer, when no server is configured, or during prerender.
   */
  multiplayer?: MultiplayerControls;
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
