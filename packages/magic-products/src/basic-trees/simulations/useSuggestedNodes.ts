import { generateId } from '@core/utils/id';
import { getRandomInRange } from '@core/utils/random';
import { CanvasElement } from '@graph/plugins/canvas/aggregator/types';
import { CoreNode } from '@graph/primitives/types';
import { MagicGraph } from '@magic/shared/graph-product';
import { SimulationDefinition } from '@magic/shared/simulation';
import tinycolor from 'tinycolor2';

import { onUnmounted } from 'vue';

import { AVLFrame } from './frames.ts';
import { AVLControls } from './useAVLSimulation.ts';

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
  graph: MagicGraph,
  simDefinition: SimulationDefinition<AVLFrame>,
  controls: AVLControls,
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
      canvas: {
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

    controls.mode.value = 'insert';
    controls.target.value = node.id;
    graph.magic.simulation.start(simDefinition);
  };

  graph.canvas.events.subscribe('onClick', kickOffNodeInsertion);
  onUnmounted(() =>
    graph.canvas.events.unsubscribe('onClick', kickOffNodeInsertion),
  );

  return {
    add: addSuggestedNodes,
    remove: removeSuggestedNodes,
  };
};

export type SuggestedNodesControls = ReturnType<typeof useSuggestedNodes>;
