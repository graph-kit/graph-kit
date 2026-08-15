import { core } from '@graph/core/index';
import { describe, expect, it } from 'vitest';

import { foldPlugins } from './fold-plugins.ts';

/**
 * Adding a node carries its position in a `position` field and nowhere else. The action
 * spreads whatever it is handed, so a caller passing flat coordinates typechecks, adds
 * the node, and silently lands it on the origin.
 */

const build = () => {
  const coreGraph = core({});
  return foldPlugins(coreGraph, [] as any, {}, () => 'd');
};

describe('adding a node with a position', () => {
  it('places a node addNode was given a position for', () => {
    const graph = build();
    const node = graph.actions.addNode({ position: { x: 10, y: 20 } });

    expect(graph.controls.positions.get(node.id)).toMatchObject({
      x: 10,
      y: 20,
    });
  });

  it('places every node addElements was given positions for', () => {
    const graph = build();
    const { addedNodes } = graph.actions.addElements({
      nodes: [
        { id: 'a', position: { x: 1, y: 2 } },
        { id: 'b', position: { x: 3, y: 4 } },
      ],
    });

    expect(addedNodes).toHaveLength(2);
    expect(graph.controls.positions.get('a')).toMatchObject({ x: 1, y: 2 });
    expect(graph.controls.positions.get('b')).toMatchObject({ x: 3, y: 4 });
  });

  // the shape that broke joining a room: every node landed on top of the origin
  it('ignores flat coordinates rather than reading them as a position', () => {
    const graph = build();
    graph.actions.addElements({
      nodes: [{ id: 'a', x: 1, y: 2 } as never],
    });

    expect(graph.controls.positions.get('a')).toMatchObject({ x: 0, y: 0 });
  });
});
