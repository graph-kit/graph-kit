import { core } from '@graph/core/index';
import { describe, expect, it } from 'vitest';

import { foldPlugins } from './fold-plugins.ts';

/**
 * the consumer tier position event. the two properties worth pinning are that a drag
 * reports once rather than per frame, and that a move is not a structural change.
 */

const build = () => {
  const coreGraph = core({});
  return foldPlugins(coreGraph, [] as any, {}, () => 'd');
};

const observe = (folded: ReturnType<typeof build>) => {
  const committed: { nodeId: string; position: { x: number; y: number } }[][] =
    [];
  let structureChanges = 0;

  folded.consumerEvents.subscribe('onNodePositionsCommitted', (entries) => {
    committed.push(entries.map((entry) => ({ ...entry }) as any));
  });
  folded.consumerEvents.subscribe('onStructureChange', () => {
    structureChanges++;
  });

  return { committed, structureChanges: () => structureChanges };
};

describe('onNodePositionsCommitted', () => {
  it('reports a direct set', () => {
    const folded = build();
    const node = folded.actions.addNode({});
    const observed = observe(folded);

    folded.controls.positions.set({
      nodeId: node.id,
      update: { x: 10, y: 20 },
    });

    expect(observed.committed).toHaveLength(1);
    expect(observed.committed[0]?.[0]?.nodeId).toBe(node.id);
  });

  // the whole reason a drag is a stream: subscribers see one settled move, not 60
  it('reports once on stream stop rather than per intermediate update', () => {
    const folded = build();
    const node = folded.actions.addNode({});
    const observed = observe(folded);

    const stream = folded.controls.positions.createStream();
    stream.set({ nodeId: node.id, update: { x: 1, y: 1 } });
    stream.set({ nodeId: node.id, update: { x: 2, y: 2 } });
    stream.set({ nodeId: node.id, update: { x: 3, y: 3 } });

    expect(observed.committed).toHaveLength(0);

    stream.stop();

    expect(observed.committed).toHaveLength(1);
    expect(observed.committed[0]).toHaveLength(1);
    expect(observed.committed[0]?.[0]?.position).toMatchObject({ x: 3, y: 3 });
  });

  // a position written from elsewhere while a drag is in flight, which is what a
  // consumer applying state it did not author does
  it('reports a direct write landing during a stream separately from it', () => {
    const folded = build();
    const dragged = folded.actions.addNode({});
    const elsewhere = folded.actions.addNode({});
    const observed = observe(folded);

    const stream = folded.controls.positions.createStream();
    stream.set({ nodeId: dragged.id, update: { x: 1, y: 1 } });

    folded.controls.positions.setMany([
      { nodeId: elsewhere.id, update: { x: 50, y: 50 } },
    ]);

    expect(observed.committed).toHaveLength(1);
    expect(observed.committed[0]?.[0]?.nodeId).toBe(elsewhere.id);

    stream.stop();

    expect(observed.committed).toHaveLength(2);
    expect(observed.committed[1]).toHaveLength(1);
    expect(observed.committed[1]?.[0]?.nodeId).toBe(dragged.id);
  });

  it('de-duplicates a node touched repeatedly within one stream', () => {
    const folded = build();
    const first = folded.actions.addNode({});
    const second = folded.actions.addNode({});
    const observed = observe(folded);

    const stream = folded.controls.positions.createStream();
    stream.setMany([
      { nodeId: first.id, update: { x: 1 } },
      { nodeId: second.id, update: { x: 1 } },
    ]);
    stream.setMany([{ nodeId: first.id, update: { x: 2 } }]);
    stream.stop();

    expect(observed.committed[0]).toHaveLength(2);
  });

  // emitting onStructureChange here would rerun every structure listener on each drag,
  // including simulation invalidation and the localStorage save
  it('does not imply a structure change', () => {
    const folded = build();
    const node = folded.actions.addNode({});
    const observed = observe(folded);

    folded.controls.positions.set({ nodeId: node.id, update: { x: 5 } });
    const stream = folded.controls.positions.createStream();
    stream.set({ nodeId: node.id, update: { x: 6 } });
    stream.stop();

    expect(observed.committed).toHaveLength(2);
    expect(observed.structureChanges()).toBe(0);
  });

  // an empty commit encoded for the wire would be a no-op payload that still bumps
  // the slice version, so it must not reach subscribers at all
  it('stays silent when a stream is stopped twice', () => {
    const folded = build();
    const node = folded.actions.addNode({});
    const observed = observe(folded);

    const stream = folded.controls.positions.createStream();
    stream.set({ nodeId: node.id, update: { x: 1 } });
    stream.stop();
    stream.stop();

    expect(observed.committed).toHaveLength(1);
  });

  it('stays silent for a stream that touched nothing', () => {
    const folded = build();
    const observed = observe(folded);

    folded.controls.positions.createStream().stop();

    expect(observed.committed).toHaveLength(0);
  });

  it('stays silent for an empty setMany', () => {
    const folded = build();
    const observed = observe(folded);

    folded.controls.positions.setMany([]);

    expect(observed.committed).toHaveLength(0);
  });
});
