import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { nullThrows } from '@core/utils/assert';
import { getCtx } from '@core/utils/canvas/index';
import { isTypingTarget } from '@core/utils/keyboard';
import { getValue } from '@core/utils/maybeGetter/index';
import { createLifecycle } from '@graph/plugins-shared/lifecycle';
import Fraction from 'fraction.js';

import { INTERACTIVE_PLUGIN_ID } from './constants.ts';
import { createDropTargetPreview } from './createDropTargetPreview.ts';
import { DEFAULT_INTERACTIVE_OPTIONS, InteractiveOptions } from './options.ts';
import { InteractivePlugin } from './types.ts';

/**
 * interactive allows users to create, edit and delete nodes and edges
 */
export const interactive =
  (options: Partial<InteractiveOptions>): InteractivePlugin =>
  ({ controls, finalActions, getters }) => {
    const optionsWithDefaults = {
      ...DEFAULT_INTERACTIVE_OPTIONS,
      ...options,
    };

    const captureHistorySnapshot = () => {
      const { recordHistory } = optionsWithDefaults;
      if (!recordHistory) return;
      controls.history?.captureSnapshot();
    };

    const newEdgeWeight = () =>
      new Fraction(getValue(optionsWithDefaults.newEdgeWeight));

    let lastClickTime = 0;

    const handleNodeCreation = ({ coords, topElement }: ElementMouseEvent) => {
      const ABOUT_A_FEW_HUNDRED_MS = 350;
      const timeDiff = Date.now() - lastClickTime;
      const closeEnoughInTime = timeDiff < ABOUT_A_FEW_HUNDRED_MS;
      if (!closeEnoughInTime) return (lastClickTime = Date.now());
      lastClickTime = 0;

      if (topElement && controls.isNode(topElement.id)) return;

      const node = finalActions.addNode({
        position: { x: coords.x, y: coords.y },
      });
      if (!node) return;

      controls.focus?.set([node.id]);
      captureHistorySnapshot();
    };

    const handleEdgeTextArea = ({ topElement, coords }: ElementMouseEvent) => {
      if (
        !topElement ||
        !topElement.shape.textHitbox?.(coords) ||
        !controls.isEdge(topElement.id)
      ) {
        return;
      }

      const ctx = getCtx(controls.surface.canvas);

      topElement.shape.startTextAreaEdit?.(ctx, (textAreaContent) => {
        const edge = nullThrows(
          getters.getEdge(topElement.id),
          'Edge not found!',
        );

        const newWeight = optionsWithDefaults.parseEdgeWeight(textAreaContent);
        if (newWeight === undefined || edge.weight.equals(newWeight)) {
          return;
        }

        controls.weights.set({ edgeId: edge.id, update: newWeight });

        captureHistorySnapshot();
      });
    };

    /** this plugin's policy on top of the graph's own rules, which are asked last */
    const doesEdgeConformToRules = (
      sourceNodeId: string,
      targetNodeId: string,
    ) => {
      if (!optionsWithDefaults.allowSelfLoops) {
        const violatesRule = sourceNodeId === targetNodeId;
        if (violatesRule) return false;
      }

      if (!optionsWithDefaults.allowRepeatConnections) {
        const edgeBetweenToAndFrom = controls
          .edges()
          .find(
            (edge) =>
              edge.source === sourceNodeId && edge.target === targetNodeId,
          );

        const edgeBetweenFromAndTo = controls
          .edges()
          .find(
            (edge) =>
              edge.source === targetNodeId && edge.target === sourceNodeId,
          );

        const violatesRule = edgeBetweenToAndFrom || edgeBetweenFromAndTo;
        if (violatesRule) return false;
      }

      return controls.inspect.canAddEdge({
        source: sourceNodeId,
        target: targetNodeId,
      });
    };

    const handleEdgeCreation = (sourceNode: { id: string }) => {
      const { elements } = controls.surface.elementsUnderCursor;

      const nodeUnderneathAnchor = elements.findLast((el) =>
        controls.isNode(el.id),
      );
      if (!nodeUnderneathAnchor) return;

      const targetNode = getters.getNode(nodeUnderneathAnchor.id);
      if (!targetNode) return;

      const canCreateEdge = doesEdgeConformToRules(
        sourceNode.id,
        targetNode.id,
      );
      if (!canCreateEdge) return;

      const edge = finalActions.addEdge({
        source: sourceNode.id,
        target: targetNode.id,
        weight: newEdgeWeight(),
      });
      if (!edge) return;

      controls.focus?.set([edge.id]);
      captureHistorySnapshot();
    };

    const removeFocusedElements = (e: KeyboardEvent) => {
      if (isTypingTarget(e)) return;
      if (e.key !== 'Backspace') return;
      finalActions.removeElements({
        nodes: controls.focus?.focusedNodes() ?? [],
        edges: controls.focus?.focusedEdges() ?? [],
      });
      captureHistorySnapshot();
    };

    const dropTargetPreview = createDropTargetPreview(
      controls,
      doesEdgeConformToRules,
      newEdgeWeight,
    );

    const onEnable = () => {
      controls.surface.events.elements.handle(
        'onMouseDown',
        handleEdgeTextArea,
        INTERACTIVE_PLUGIN_ID,
      );
      controls.surface.events.elements.handle(
        'onClick',
        handleNodeCreation,
        INTERACTIVE_PLUGIN_ID,
      );
      controls.anchors?.events.subscribe(
        'onNodeAnchorDrop',
        handleEdgeCreation,
      );
      controls.surface.events.dom.subscribe('onKeyDown', removeFocusedElements);
      dropTargetPreview.enable();
    };

    const onDisable = () => {
      controls.surface.events.elements.unhandle(
        'onMouseDown',
        handleEdgeTextArea,
      );
      controls.surface.events.elements.unhandle('onClick', handleNodeCreation);
      controls.anchors?.events.unsubscribe(
        'onNodeAnchorDrop',
        handleEdgeCreation,
      );
      controls.surface.events.dom.unsubscribe(
        'onKeyDown',
        removeFocusedElements,
      );
      dropTargetPreview.disable();
    };

    const lifecycle = createLifecycle({
      onEnable,
      onDisable,
    });

    lifecycle.enable();

    return {
      name: 'interactive',
      controls: {
        lifecycle,
      },
    };
  };
