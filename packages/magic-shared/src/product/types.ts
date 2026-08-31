import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { CanvasSurface } from '@canvas/surface/types';
import { AnnotationsControls } from '@core/annotations/index';
import { ReadonlyEventHub } from '@core/events/createEventHub';
import { MaybeGetter } from '@core/utils/maybeGetter/index';
import { DraggedElement, UserId } from '@multiplayer/protocol/room';
import { Tier } from '@multiplayer/protocol/tiers';
import { BasicColorMode } from '@vueuse/core';
import { DeepReadonly } from 'ts-essentials';
import * as Y from 'yjs';

import { ComputedRef } from 'vue';

import { ComponentSlotControls } from '../component-slot/useComponentSlotsState.ts';
import { LensControls } from '../lens/useLensState.ts';
import { ProductMultiplayer } from '../multiplayer/types.ts';
import { ShortcutControls } from '../shortcuts/useShortcuts.ts';
import { SimulationButtonDefinition } from '../simulation/start-buttons/types.ts';
import { SimulationControls } from '../simulation/useSimulationState.ts';
import { AnnotationsUIControls } from '../ui/annotations/useAnnotationsUI.ts';
import { AppearanceControls } from '../ui/appearance/useShellAppearance.ts';
import { DebugControls } from '../ui/debug/useDebugState.ts';
import { HelpMenuItem } from '../ui/help-menu/types.ts';
import { HelpMenuControls } from '../ui/help-menu/useHelpMenuState.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';
import { ToastControls } from '../ui/toast/types.ts';
import { ShellFlagOptions, ShellFlags } from './flags.ts';
import { JumpToContentControls } from './internals/useJumpToContent.ts';
import { LocalStorageControls } from './internals/useShellLocalStorage.ts';
import { ProductId } from './manifests/index.ts';
import { ProductManifest } from './manifests/types.ts';

/** turns an encoded payload into a string light enough to fit somewhere tight, like a link */
export type TransitCompression = {
  compress: (payload: any) => string;
  decompress: (text: string) => any;
};

export type TransitField = {
  encode: () => any;
  decode: (payload: any) => void;
  /** absent when the host has nothing better than JSON to offer, see {@link TransitCompression} */
  compression?: TransitCompression;
};

/** a product's drag, in the three moments the room cares about */
export type DragEventMap = {
  onDragStarted: (elements: DraggedElement[]) => void;
  onDragMoved: (elements: DraggedElement[]) => void;
  onDragEnded: () => void;
};

export type HistoryField = {
  canRedo: ComputedRef<boolean>;
  canUndo: ComputedRef<boolean>;
  undo: () => void;
  redo: () => void;
  /** makes whatever the graph holds right now the state undo bottoms out at */
  clear: () => void;
};

/**
 * what the shell hands consumers: the host's history plus a way to hold undo and redo
 * off while the product's state isn't ready to handle it
 */
export type ShellHistory = HistoryField & {
  /**
   * blocks undo and redo until the returned release is called. `message` is what the
   * buttons report as their reason for being disabled
   */
  suppress: (message: string) => () => void;
  /** why undo and redo are blocked, `undefined` when they are not */
  suppression: ComputedRef<string | undefined>;
};

export type DocBinding = {
  history: HistoryField;
  /** stops mirroring, leaving the product's own state exactly as the document left it */
  unbind: () => void;
  /**
   * One peer's in flight move. Nothing here is written to the document, which the
   * authoring peer commits itself. Can arrive for a peer already mid drag, since a drag
   * the room released early is revived rather than abandoned.
   */
  applyPeerDrag: (peerId: UserId, elements: DraggedElement[]) => void;
  /** they dropped, navigated, disconnected or were let go by the room */
  endPeerDrag: (peerId: UserId) => void;
};

/**
 * everything the shell needs in order to function
 */
export type ProductControls = {
  /**
   * how the product's state is serialized. absent when it has none worth carrying, which
   * is what local storage and link sharing are built on, see {@link ShellFlags}
   */
  transit?: TransitField;
  /**
   * the annotation tools the product owns, absent when it has none or has them flagged off.
   * the shell only puts chrome around them, so anything holding a canvas can hand its
   * own over, see `@core/annotations`
   */
  annotations?: AnnotationsControls;
  surface: CanvasSurface;
  onAppearanceChanged: (color: BasicColorMode) => void;
  multiplayer: MultiplayerControls;
  history?: HistoryField;
  /** absent when the product has no content worth jumping back to, see {@link ShellFlags} */
  isContent?: ContentPredicate;
};

/** which canvas elements are the product's content, and which are painted alongside it */
export type ContentPredicate = (
  element: DeepReadonly<CanvasElement>,
) => boolean;

/** what a product does as the local user takes a tier on and gives it up */
export type TierBehavior = {
  /** the local user is now on this tier */
  enter?: () => void;
  /** the local user is no longer on this tier, whether reassigned or out of the room */
  exit?: () => void;
};

/**
 * Where a room document's opening state comes from. A room seeds once, from the product
 * it was opened on; every product it reaches after that adopts, an empty document
 * included, so arriving somewhere nobody has been yet starts blank rather than filling
 * the room with whatever the arriving client happened to be holding.
 */
export type DocBindMode = 'seed' | 'adopt';

/**
 * The mapping between what a product holds and the room's document, in both directions. The
 * only thing that knows either shape, which is what keeps the document out of the shell
 * and the room out of the product.
 *
 * Separate from {@link TransitField} because the document's shape is not transit's, and
 * adopting one can mean more than writing it (stopping a simulation, dropping a lens).
 */
export type MultiplayerControls = {
  /**
   * Ties the product to the room's document for as long as the product is mounted, mirroring
   * changes both ways from then on. Seeding writes what the product holds into the document,
   * adopting rebuilds the product from it, see {@link DocBindMode}.
   *
   * Answers with the binding it made: undo over the document, which the shell swaps in
   * for as long as the room owns the product, and the teardown that lets a later join
   * rebind onto a different document.
   */
  bind: (doc: Y.Doc, mode: DocBindMode) => DocBinding | undefined;

  /**
   * What the product does about each tier, in one place, because the question a product has to
   * answer is not "how do I lock down read" but "what does each of these mean for me".
   *
   * Exhaustive: a tier added to the protocol is a compile error at every product until it
   * decides, rather than a permission that quietly does nothing. A tier a product has
   * nothing to say about is an empty object, which is that decision written down.
   *
   * Enter runs after exit of the tier being left, and leaving the room exits without
   * entering anything, since a tier is something only a room grants.
   */
  tiers: Record<Tier, TierBehavior>;

  /**
   * What the product is moving, as a lifecycle rather than a value to read. Pushed rather
   * than pulled so a drag travels on its own signal instead of alongside the cursor that
   * happens to be causing it, which is what lets the room tell a held element from a
   * stale one. Absent for a product with nothing draggable.
   */
  drag?: ReadonlyEventHub<DragEventMap>;
};

export type ShellOptions = {
  productId: ProductId;
  /** what the product asks for, see {@link ShellFlags} */
  flags?: ShellFlagOptions;
  /** what this product adds to the help menu beyond its shortcuts */
  helpMenu?: MaybeGetter<HelpMenuItem[]>;
  lensChips?: LensChipDefinition[];
  simulationButtons?: SimulationButtonDefinition[];
};

/** the shell itself: the chrome and controls wrapped around a product */
export type Shell = {
  manifest: ProductManifest;
  flags: ShellFlags;
  lens: LensControls;
  componentSlots: ComponentSlotControls;
  simulation: SimulationControls;
  appearance: AppearanceControls;
  shortcuts: ShortcutControls;
  debug: DebugControls;
  helpMenu: HelpMenuControls;
  /** the app wide toast queue, which every product shares, see {@link ToastControls} */
  toast: ToastControls;
  surface: CanvasSurface;
  transit?: TransitField;
  history?: ShellHistory;
  annotations?: AnnotationsUIControls;
  lensChips?: LensChipDefinition[];
  simulationButtons?: SimulationButtonDefinition[];
  localStorage: LocalStorageControls;
  /** absent when the host named no content, see {@link ProductControls.isContent} */
  jumpToContent?: JumpToContentControls;
  /**
   * The room connection, or undefined if
   * 1. product has opted-out of multiplayer in its manifest or
   * 2. no server is configured or
   * 3. during prerender
   */
  multiplayer?: ProductMultiplayer;
};
