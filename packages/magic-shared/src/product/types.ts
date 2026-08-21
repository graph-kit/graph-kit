import { CanvasSurface } from '@canvas/surface/types';
import { AnnotationsControls } from '@core/annotations/index';
import { DraggedElement, UserId } from '@multiplayer/protocol/room';
import { Tier } from '@multiplayer/protocol/tiers';
import { BasicColorMode } from '@vueuse/core';
import * as Y from 'yjs';

import { ComputedRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { LensControls } from '../lens/useLensState.ts';
import { ProductMultiplayer } from '../multiplayer/types.ts';
import { ShortcutControls } from '../shortcuts/useShortcuts.ts';
import { SimulationButtonDefinition } from '../simulation/start-buttons/types.ts';
import { SimulationControls } from '../simulation/useSimulationState.ts';
import { AnnotationsUIControls } from '../ui/annotations/useAnnotationsUI.ts';
import { AppearanceControls } from '../ui/appearance/useProductAppearance.ts';
import { DebugControls } from '../ui/debug/useDebugState.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';
import { ProductFlagOptions, ProductFlags } from './flags.ts';
import { LocalStorageControls } from './internals/useProductLocalStorage.ts';
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
  /**
   * Every peer's in flight move, whole rather than incremental: a peer missing from the
   * record has stopped moving things, whether they dropped, left or were never dragging.
   * Nothing here is written to the document, which the authoring peer commits itself.
   */
  applyPeerDrags: (dragsByPeer: Record<UserId, DraggedElement[]>) => void;
};

/**
 * everything the magic product harness needs in order to function
 */
export type MagicProductHost = {
  /**
   * how the host's state is serialized. absent when it has none worth carrying, which
   * is what local storage and link sharing are built on, see {@link ProductFlags}
   */
  transit?: TransitField;
  /**
   * the annotation tools the host owns, absent when it has none or has them flagged off.
   * the harness only puts chrome around them, so anything holding a canvas can hand its
   * own over, see `@core/annotations`
   */
  annotations?: AnnotationsControls;
  surface: CanvasSurface;
  onAppearanceChanged: (color: BasicColorMode) => void;
  multiplayer: MultiplayerHostField;
  history?: HistoryField;
};

/** what a host does as the local user takes a tier on and gives it up */
export type TierBehavior = {
  /** the local user is now on this tier */
  enter?: () => void;
  /** the local user is no longer on this tier, whether reassigned or out of the room */
  exit?: () => void;
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

  /**
   * What the host does about each tier, in one place, because the question a host has to
   * answer is not "how do I lock down read" but "what does each of these mean for me".
   *
   * Exhaustive: a tier added to the protocol is a compile error at every host until it
   * decides, rather than a permission that quietly does nothing. A tier a host has
   * nothing to say about is an empty object, which is that decision written down.
   *
   * Enter runs after exit of the tier being left, and leaving the room exits without
   * entering anything, since a tier is something only a room grants.
   */
  tiers: Record<Tier, TierBehavior>;

  /**
   * whatever the host is moving this instant, read as presence goes out rather than
   * pushed, since a drag only travels alongside the cursor that is causing it
   */
  draggedElements?: () => DraggedElement[];
};

export type MagicProductOptions = {
  productId: ProductId;
  /** what the product asks for, see {@link ProductFlags} */
  flags?: ProductFlagOptions;
  lensChips?: LensChipDefinition[];
  simulationButtons?: SimulationButtonDefinition[];
};

/** the harness itself: the chrome and controls wrapped around a hosted product */
export type Magic = {
  manifest: MagicProductManifest;
  flags: ProductFlags;
  lens: LensControls;
  componentSlots: ComponentSlotControls;
  simulation: SimulationControls;
  appearance: AppearanceControls;
  shortcuts: ShortcutControls;
  debug: DebugControls;
  surface: CanvasSurface;
  transit?: TransitField;
  history?: HistoryField;
  annotations?: AnnotationsUIControls;
  lensChips?: LensChipDefinition[];
  simulationButtons?: SimulationButtonDefinition[];
  localStorage: LocalStorageControls;
  /**
   * The room connection, or undefined if
   * 1. product has opted-out of multiplayer in its manifest or
   * 2. no server is configured or
   * 3. during prerender
   */
  multiplayer?: ProductMultiplayer;
};
