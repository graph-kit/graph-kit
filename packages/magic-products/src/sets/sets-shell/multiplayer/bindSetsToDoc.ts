import type {
  AnnotationsChange,
  AnnotationsControls,
} from '@core/annotations/index';
import {
  type DocAnnotation,
  annotationFromDoc,
  annotationToDoc,
  readAnnotationsMap,
} from '@magic/shared/multiplayer/doc/annotations';
import { createDocHistory } from '@magic/shared/multiplayer/doc/history';
import {
  RECONCILE_ORIGIN,
  isOwnWrite,
} from '@magic/shared/multiplayer/doc/origins';
import { createDocWriter } from '@magic/shared/multiplayer/doc/writer';
import type { DocBindMode, DocBinding } from '@magic/shared/product';
import type { UserId } from '@multiplayer/protocol/room';
import * as Y from 'yjs';

import { SET_LABEL_SEQUENCE } from '../../composables/useLabel.ts';
import { MAX_SETS, RESERVED_LABELS } from '../../constants.ts';
import type { DefinitionsChange } from '../../events.ts';
import type { SetDefinitions } from '../../setDefinitions.ts';
import type { SetGestures } from '../../setGestures.ts';
import type { SetDefinition, SetDefinitionId } from '../../types.ts';

/**
 * The room's view of a set. Flat rather than nested, matching what transit puts in a
 * link, so the two never disagree about the shape of a circle.
 */
type DocSet = {
  label: string;
  x: number;
  y: number;
  radius: number;
};

const readSetsMap = (doc: Y.Doc) => doc.getMap<DocSet>('sets');

/** sorted so every client walks the same document in the same order */
const sortedEntries = <T>(map: Y.Map<T>): [string, T][] =>
  [...map.entries()].sort(([left], [right]) => (left < right ? -1 : 1));

export type BindSetsToDocParts = {
  sets: SetDefinitions;
  annotations: AnnotationsControls;
  gestures: SetGestures;
};

/**
 * Ties sets to a room document, in both directions, for as long as the product is
 * mounted.
 *
 * The two directions are deliberately not symmetrical. Going out, only what changed is
 * written, so a peer editing a different circle at the same moment is not overwritten.
 * Coming in, the whole canvas is rebuilt: at eight circles of four numbers it is cheaper
 * to read than to diff, and it cannot drift the way an incremental apply can.
 */
export const bindSetsToDoc = (
  { sets, annotations, gestures }: BindSetsToDocParts,
  doc: Y.Doc,
  mode: DocBindMode,
): DocBinding => {
  const setsMap = readSetsMap(doc);
  const annotationsMap = readAnnotationsMap(doc);

  const { intoDoc, intoProduct } = createDocWriter(doc);

  /** what each peer has hold of right now, so a document change can leave those alone */
  const peerHeld = new Map<UserId, Set<SetDefinitionId>>();

  /**
   * Whether a gesture owns this set right now, this user's or a peer's. A held circle
   * runs ahead of the document until the gesture commits, so reconciling it to what the
   * document last saw is always wrong.
   */
  const isHeld = (setId: SetDefinitionId) =>
    gestures.isHolding(setId) ||
    [...peerHeld.values()].some((setIds) => setIds.has(setId));

  const docSetFor = (setId: SetDefinitionId): DocSet | undefined => {
    if (!sets.hasDefinition(setId)) return;
    const { label, display } = sets.getDefinition(setId);
    return { label, x: display.at.x, y: display.at.y, radius: display.radius };
  };

  const definitionFrom = (
    id: SetDefinitionId,
    docSet: DocSet,
  ): SetDefinition => ({
    id,
    label: docSet.label,
    display: isHeld(id)
      ? sets.getDefinition(id).display
      : { at: { x: docSet.x, y: docSet.y }, radius: docSet.radius },
  });

  /**
   * Two people can pick the same letter, or push the canvas past its cap, because each
   * decided against a document that had not heard from the other yet. Resolving it
   * locally would leave every client disagreeing with the document for good, so the fix
   * is written back, computed from sorted ids so that every client reaches the same
   * answer and their identical writes simply merge.
   */
  const reconcileDoc = () => {
    const entries = sortedEntries(setsMap);

    // the cap first, so a letter is not handed to a set about to be dropped
    const surplus = entries.slice(MAX_SETS);
    const kept = entries.slice(0, MAX_SETS);

    const taken = new Set<string>(RESERVED_LABELS);
    const relabelled: [string, DocSet][] = [];

    for (const [id, docSet] of kept) {
      if (!taken.has(docSet.label)) {
        taken.add(docSet.label);
        continue;
      }
      // the alphabet outruns MAX_SETS, so there is always one left
      const label = SET_LABEL_SEQUENCE.find(
        (candidate) => !taken.has(candidate),
      );
      if (!label) continue;
      taken.add(label);
      relabelled.push([id, { ...docSet, label }]);
    }

    if (surplus.length === 0 && relabelled.length === 0) return;

    intoDoc(() => {
      for (const [id] of surplus) setsMap.delete(id);
      for (const [id, docSet] of relabelled) setsMap.set(id, docSet);
    }, RECONCILE_ORIGIN);
  };

  /** reconciles the document to match what is on screen, additions and removals alike */
  const writeWholeProduct = () => {
    intoDoc(() => {
      const liveSetIds = new Set(sets.definitions.value.map(({ id }) => id));
      for (const id of [...setsMap.keys()]) {
        if (!liveSetIds.has(id)) setsMap.delete(id);
      }
      for (const id of liveSetIds) {
        const docSet = docSetFor(id);
        if (docSet) setsMap.set(id, docSet);
      }

      const live = annotations.annotations();
      const liveAnnotationIds = new Set(live.map(({ id }) => id));
      for (const id of [...annotationsMap.keys()]) {
        if (!liveAnnotationIds.has(id)) annotationsMap.delete(id);
      }
      for (const annotation of live) {
        annotationsMap.set(annotation.id, annotationToDoc(annotation));
      }
    });
  };

  /**
   * Rebuilds the canvas from the document. Queries are not read, and not written
   * anywhere either: they stay on the device that typed them, so a peer joining keeps
   * their own and a read tier viewer can still write some.
   */
  const readWholeDoc = () => {
    intoProduct(() => {
      sets.setAll(
        sortedEntries(setsMap).map(([id, docSet]) =>
          definitionFrom(id, docSet),
        ),
      );
      annotations.setAll(
        sortedEntries(annotationsMap).map(([id, annotation]) =>
          annotationFromDoc(id, annotation),
        ),
      );
    });
  };

  const onTransaction = (transaction: Y.Transaction) => {
    if (isOwnWrite(transaction)) return;
    // ahead of the read, so what lands on the canvas is already the settled document
    reconcileDoc();
    readWholeDoc();
  };

  const onDefinitionsChanged = ({ added, removedIds }: DefinitionsChange) => {
    intoDoc(() => {
      for (const { id } of added) {
        const docSet = docSetFor(id);
        if (docSet) setsMap.set(id, docSet);
      }
      for (const id of removedIds) setsMap.delete(id);
    });
  };

  // the settled gesture rather than every frame of it, which would be a message per
  // frame. the moving itself travels over presence, see trackDraggedSets
  const onGestureEnded = (setId: SetDefinitionId) => {
    intoDoc(() => {
      const docSet = docSetFor(setId);
      if (docSet) setsMap.set(setId, docSet);
    });
  };

  // the settled stroke rather than every point of it, the same boundary a gesture draws
  const onAnnotationsChanged = ({ added, removed }: AnnotationsChange) => {
    intoDoc(() => {
      for (const annotation of added) {
        annotationsMap.set(annotation.id, annotationToDoc(annotation));
      }
      for (const annotation of removed) annotationsMap.delete(annotation.id);
    });
  };

  const subscribe = () => {
    doc.on('afterTransaction', onTransaction);
    sets.events.subscribe('onDefinitionsChanged', onDefinitionsChanged);
    gestures.events.subscribe('onGestureEnded', onGestureEnded);
    annotations.events.subscribe('onAnnotationsChanged', onAnnotationsChanged);
  };

  const unbind = () => {
    peerHeld.clear();
    doc.off('afterTransaction', onTransaction);
    sets.events.unsubscribe('onDefinitionsChanged', onDefinitionsChanged);
    gestures.events.unsubscribe('onGestureEnded', onGestureEnded);
    annotations.events.unsubscribe(
      'onAnnotationsChanged',
      onAnnotationsChanged,
    );
  };

  /*
    simpler than the graph's, which needs a position stream because it has a presented and
    a committed position to keep apart. sets has one, so a peer's frame is written
    straight in and their own commit is what settles it through the document
  */
  const applyPeerDrag: DocBinding['applyPeerDrag'] = (peerId, elements) => {
    const held = peerHeld.get(peerId) ?? new Set<SetDefinitionId>();
    peerHeld.set(peerId, held);

    intoProduct(() => {
      for (const { id, position } of elements) {
        // the resize band ids the room was told about are not sets, and neither is one
        // this client has already removed
        if (!sets.hasDefinition(id)) continue;
        // what this user has hold of stays where they are putting it
        if (gestures.isHolding(id)) continue;
        held.add(id);
        sets.placeDefinition(id, position);
      }
    });
  };

  const endPeerDrag: DocBinding['endPeerDrag'] = (peerId) => {
    peerHeld.delete(peerId);
  };

  if (mode === 'seed') writeWholeProduct();
  else {
    reconcileDoc();
    readWholeDoc();
  }

  subscribe();

  return {
    // after the seed, so undoing on a freshly opened canvas cannot empty the document
    history: createDocHistory(doc, [setsMap, annotationsMap]),
    unbind,
    applyPeerDrag,
    endPeerDrag,
  };
};
