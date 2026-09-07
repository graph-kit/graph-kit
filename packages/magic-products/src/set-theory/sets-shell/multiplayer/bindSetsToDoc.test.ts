import type { CanvasSurface } from '@canvas/surface/types';
import { createAnnotations } from '@core/annotations/index';
import type { Annotation } from '@core/annotations/index';
import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { ref } from 'vue';

import { MAX_SETS } from '../../constants.ts';
import { createSetDefinitions } from '../../setDefinitions.ts';
import { createSetGestures } from '../../setGestures.ts';
import type { SetDefinition } from '../../types.ts';
import { bindSetsToDoc } from './bindSetsToDoc.ts';

const stubSurface = () =>
  ({
    camera: { state: { panX: ref(0), panY: ref(0), zoom: ref(1) } },
    aggregator: { addTransformer: () => {} },
    events: {
      elements: { handle: () => {}, unhandle: () => {} },
      canvas: { subscribe: () => {}, unsubscribe: () => {} },
      dom: { subscribe: () => {}, unsubscribe: () => {} },
    },
  }) as unknown as CanvasSurface;

const stroke = (id: string): Annotation => ({
  id,
  type: 'draw',
  points: [{ x: 1, y: 2 }],
  fillColor: '#ff0000',
  brushWeight: 4,
});

/** everything the real product stands up, minus the canvas the engine paints on */
const createClient = (room?: Y.Doc) => {
  const sets = createSetDefinitions();
  const annotations = createAnnotations({ surface: stubSurface() });
  const gestures = createSetGestures();

  const doc = new Y.Doc();
  if (room) Y.applyUpdate(doc, Y.encodeStateAsUpdate(room));

  const bind = (mode: 'seed' | 'adopt' = room ? 'adopt' : 'seed') =>
    bindSetsToDoc({ sets, annotations, gestures }, doc, mode);

  return { sets, annotations, gestures, doc, bind };
};

const sync = (from: Y.Doc, to: Y.Doc) =>
  Y.applyUpdate(to, Y.encodeStateAsUpdate(from, Y.encodeStateVector(to)));

const labelsOf = (sets: ReturnType<typeof createClient>['sets']) =>
  sets.definitions.value.map(({ label }) => label);

const definitionOf = (
  sets: ReturnType<typeof createClient>['sets'],
  label: string,
) =>
  sets.definitions.value.find((definition) => definition.label === label) as
    SetDefinition | undefined;

/** a whole gesture, the way the circle composables report one */
const drag = (
  client: ReturnType<typeof createClient>,
  setId: string,
  by: { x: number; y: number },
) => {
  client.gestures.report.held(setId);
  client.sets.moveDefinition(setId, by);
  client.gestures.report.released(setId);
};

describe(bindSetsToDoc, () => {
  it('writes what is on screen into a document it seeds', () => {
    const author = createClient();
    author.sets.addDefinition({ x: 10, y: 20 });
    author.annotations.add([stroke('one')]);

    author.bind();

    expect([...author.doc.getMap('sets').keys()]).toHaveLength(1);
    expect([...author.doc.getMap('annotations').keys()]).toEqual(['one']);
  });

  it('rebuilds a canvas from a document it adopts', () => {
    const author = createClient();
    author.sets.addDefinition({ x: 10, y: 20 });
    author.annotations.add([stroke('one')]);
    author.bind();

    const peer = createClient(author.doc);
    peer.bind();

    expect(labelsOf(peer.sets)).toEqual(['A']);
    expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({ x: 10, y: 20 });
    expect(peer.annotations.annotations().map(({ id }) => id)).toEqual(['one']);
  });

  it('adopts an empty document rather than filling it', () => {
    const author = createClient();
    author.bind();

    const peer = createClient(author.doc);
    peer.sets.addDefinition({ x: 0, y: 0 });
    peer.bind();

    expect(labelsOf(peer.sets)).toEqual([]);
  });

  it('carries an added and a removed set across', () => {
    const author = createClient();
    author.bind();
    const peer = createClient(author.doc);
    peer.bind();

    const added = author.sets.addDefinition({ x: 5, y: 5 });
    if (!added) throw new Error('the canvas was full');
    sync(author.doc, peer.doc);
    expect(labelsOf(peer.sets)).toEqual(['A']);

    author.sets.removeDefinition(added.id);
    sync(author.doc, peer.doc);
    expect(labelsOf(peer.sets)).toEqual([]);
  });

  it('carries a settled drag across, and nothing before it settles', () => {
    const author = createClient();
    author.bind();
    const peer = createClient(author.doc);
    peer.bind();

    const added = author.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was full');
    sync(author.doc, peer.doc);

    author.gestures.report.held(added.id);
    author.sets.moveDefinition(added.id, { x: 40, y: 0 });
    sync(author.doc, peer.doc);
    // mid gesture the room has only what was last committed
    expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({ x: 0, y: 0 });

    author.gestures.report.released(added.id);
    sync(author.doc, peer.doc);
    expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({ x: 40, y: 0 });
  });

  it('carries a resize across on the same boundary', () => {
    const author = createClient();
    author.bind();
    const peer = createClient(author.doc);
    peer.bind();

    const added = author.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was full');
    author.gestures.report.held(added.id);
    author.sets.resizeDefinition(added.id, 120);
    author.gestures.report.released(added.id);
    sync(author.doc, peer.doc);

    expect(definitionOf(peer.sets, 'A')?.display.radius).toBe(120);
  });

  it('carries strokes across, drawn and erased', () => {
    const author = createClient();
    author.bind();
    const peer = createClient(author.doc);
    peer.bind();

    author.annotations.add([stroke('one'), stroke('two')]);
    sync(author.doc, peer.doc);
    expect(peer.annotations.annotations().map(({ id }) => id)).toEqual([
      'one',
      'two',
    ]);

    author.annotations.remove(['one']);
    sync(author.doc, peer.doc);
    expect(peer.annotations.annotations().map(({ id }) => id)).toEqual(['two']);
  });

  it('leaves a set this user has hold of where they are putting it', () => {
    const author = createClient();
    author.bind();
    const peer = createClient(author.doc);
    peer.bind();

    const added = author.sets.addDefinition({ x: 0, y: 0 });
    if (!added) throw new Error('the canvas was full');
    sync(author.doc, peer.doc);

    // the peer takes hold and moves it, then the author's own commit arrives
    peer.gestures.report.held(added.id);
    peer.sets.moveDefinition(added.id, { x: 200, y: 200 });

    drag(author, added.id, { x: 10, y: 0 });
    sync(author.doc, peer.doc);

    expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({
      x: 200,
      y: 200,
    });
  });

  it('keeps queries off the wire entirely', () => {
    const author = createClient();
    author.sets.addDefinition({ x: 0, y: 0 });
    author.bind();

    expect([...author.doc.share.keys()].sort()).toEqual([
      'annotations',
      'sets',
    ]);
  });

  describe('what two people deciding at once can produce', () => {
    it('resolves a label collision the same way on every client', () => {
      const author = createClient();
      author.bind();
      const peer = createClient(author.doc);
      peer.bind();

      // neither has heard of the other's set, so both name theirs A
      author.sets.addDefinition({ x: 0, y: 0 });
      peer.sets.addDefinition({ x: 100, y: 0 });
      expect(labelsOf(author.sets)).toEqual(['A']);
      expect(labelsOf(peer.sets)).toEqual(['A']);

      sync(author.doc, peer.doc);
      sync(peer.doc, author.doc);
      sync(author.doc, peer.doc);

      expect(labelsOf(author.sets).sort()).toEqual(['A', 'B']);
      expect(labelsOf(peer.sets).sort()).toEqual(['A', 'B']);
      // and the same set holds the same letter on both
      expect(author.sets.idByLabel.value['A']).toBe(
        peer.sets.idByLabel.value['A'],
      );
      expect(author.sets.idByLabel.value['B']).toBe(
        peer.sets.idByLabel.value['B'],
      );
    });

    it('drops back to the cap, choosing the same victims everywhere', () => {
      const author = createClient();
      author.bind();
      const peer = createClient(author.doc);
      peer.bind();

      for (let index = 0; index < MAX_SETS; index++) {
        author.sets.addDefinition({ x: index, y: 0 });
      }
      sync(author.doc, peer.doc);

      // both fill the last slot at once, from a canvas that had one left
      author.sets.removeDefinition(
        author.sets.definitions.value[MAX_SETS - 1].id,
      );
      sync(author.doc, peer.doc);
      author.sets.addDefinition({ x: 900, y: 0 });
      peer.sets.addDefinition({ x: 901, y: 0 });

      sync(author.doc, peer.doc);
      sync(peer.doc, author.doc);
      sync(author.doc, peer.doc);

      expect(author.sets.definitions.value).toHaveLength(MAX_SETS);
      expect(peer.sets.definitions.value).toHaveLength(MAX_SETS);
      expect(author.sets.definitions.value.map(({ id }) => id).sort()).toEqual(
        peer.sets.definitions.value.map(({ id }) => id).sort(),
      );

      /*
        and the document agrees. capping only where the canvas is built would leave the
        surplus in the room for good: nobody can see it, so nobody can delete it, and
        every client that ever joins drops it again
      */
      expect(author.doc.getMap('sets').size).toBe(MAX_SETS);
      expect(peer.doc.getMap('sets').size).toBe(MAX_SETS);
    });
  });

  describe('a peer mid drag', () => {
    it('shows their move without writing it to the document', () => {
      const author = createClient();
      author.bind();
      const peer = createClient(author.doc);
      const binding = peer.bind();

      const added = author.sets.addDefinition({ x: 0, y: 0 });
      if (!added) throw new Error('the canvas was full');
      sync(author.doc, peer.doc);

      binding.applyPeerDrag('someone', [
        { id: added.id, position: { x: 70, y: 5 } },
      ]);

      expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({ x: 70, y: 5 });
      // their own commit is what settles it, so nothing goes out from here
      expect(peer.doc.getMap('sets').get(added.id)).toMatchObject({
        x: 0,
        y: 0,
      });
    });

    it('ignores the resize band ids the room was told about', () => {
      const author = createClient();
      author.bind();
      const peer = createClient(author.doc);
      const binding = peer.bind();

      const added = author.sets.addDefinition({ x: 0, y: 0 });
      if (!added) throw new Error('the canvas was full');
      sync(author.doc, peer.doc);

      expect(() =>
        binding.applyPeerDrag('someone', [
          { id: `${added.id}/resize`, position: { x: 70, y: 5 } },
        ]),
      ).not.toThrow();
      expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({ x: 0, y: 0 });
    });

    it('lets a document change through once they let go', () => {
      const author = createClient();
      author.bind();
      const peer = createClient(author.doc);
      const binding = peer.bind();

      const added = author.sets.addDefinition({ x: 0, y: 0 });
      if (!added) throw new Error('the canvas was full');
      sync(author.doc, peer.doc);

      binding.applyPeerDrag('someone', [
        { id: added.id, position: { x: 70, y: 5 } },
      ]);
      binding.endPeerDrag('someone');

      drag(author, added.id, { x: 12, y: 0 });
      sync(author.doc, peer.doc);

      expect(definitionOf(peer.sets, 'A')?.display.at).toEqual({ x: 12, y: 0 });
    });
  });

  it('stops mirroring after unbind', () => {
    const author = createClient();
    author.bind();
    const peer = createClient(author.doc);
    const binding = peer.bind();

    binding.unbind();

    author.sets.addDefinition({ x: 0, y: 0 });
    sync(author.doc, peer.doc);

    expect(labelsOf(peer.sets)).toEqual([]);
  });
});
