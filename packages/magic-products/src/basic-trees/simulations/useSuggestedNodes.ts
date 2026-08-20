import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { generateId } from '@core/utils/id';
import { getRandomInRange } from '@core/utils/random';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import tinycolor from 'tinycolor2';

import { onUnmounted } from 'vue';

import { TreeControls } from './useTreeSimulation.ts';

const Y = 250;
const X = 800;

const POSITIONS = [
  { x: X - 200, y: Y },
  { x: X - 100, y: Y },
  { x: X, y: Y },
  { x: X + 100, y: Y },
  { x: X + 200, y: Y },
];

/**
 * the row of candidate values offered above the tree. they are phantom nodes rather than
 * real ones so the tree, history and share links only ever see nodes the user committed to
 */
export const useSuggestedNodes = (
  graph: Graph,
  onClicked: () => void,
  controls: TreeControls,
) => {
  const suggestions = () => graph.phantom.nodes();

  const addSuggestedNodes = () => {
    removeSuggestedNodes();
    graph.phantom.addElements({
      nodes: POSITIONS.map((position) => ({
        id: generateId(),
        label: getRandomInRange(1, 5).toString(),
        position,
      })),
      edges: [],
    });
  };

  const removeSuggestedNodes = () => {
    graph.phantom.removeElements({
      nodeIds: suggestions().map((node) => node.id),
      edgeIds: [],
    });
  };

  const dimSuggested = ({ id }: CoreNode, resolveUnderneath: () => string) => {
    const isSuggested = suggestions().some((node) => node.id === id);
    if (!isSuggested) return;
    const tinycolorRes = tinycolor(resolveUnderneath());
    return tinycolorRes.setAlpha(0.5).toHex8String();
  };

  graph.theme
    .createThemer({
      surface: {
        'node.default.color': dimSuggested,
        'node.default.text.color': dimSuggested,
        'node.default.border.color': dimSuggested,
      },
    })
    .activate();

  const kickOffNodeInsertion = ({
    topElement,
  }: {
    topElement: CanvasElement | undefined;
  }) => {
    if (!topElement) return;
    const suggestion = suggestions().find((node) => node.id === topElement.id);
    if (!suggestion) return;

    // committing to a suggestion promotes it into a real node, since the tree can only
    // insert something the graph actually contains
    graph.phantom.removeNode(suggestion.id);
    const node = graph.actions.addNode({
      id: suggestion.id,
      label: suggestion.label,
      position: suggestion.position,
    });
    if (!node) return;

    controls.mode.value = 'insert';
    controls.target.value = node.id;
    onClicked();
  };

  graph.surface.events.elements.subscribe('onClick', kickOffNodeInsertion);
  onUnmounted(() =>
    graph.surface.events.elements.unsubscribe('onClick', kickOffNodeInsertion),
  );

  return {
    add: addSuggestedNodes,
    remove: removeSuggestedNodes,
  };
};

export type SuggestedNodesControls = ReturnType<typeof useSuggestedNodes>;
