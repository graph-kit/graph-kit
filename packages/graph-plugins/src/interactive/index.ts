import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { nullThrows } from '@core/utils/assert';
import { getCtx } from '@core/utils/canvas/index';
import { isTypingTarget } from '@core/utils/keyboard';
import { getValue } from '@core/utils/maybeGetter/index';
import Fraction from 'fraction.js';

import { INTERACTIVE_PLUGIN_ID } from './constants.ts';
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

    let lastClickTime = 0;

    const handleNodeCreation = ({ coords, topElement }: ElementMouseEvent) => {
      const ABOUT_A_FEW_HUNDRED_MS = 350;
      const timeDiff = Date.now() - lastClickTime;
      const closeEnoughInTime = timeDiff < ABOUT_A_FEW_HUNDRED_MS;
      if (!closeEnoughInTime) return (lastClickTime = Date.now());
      lastClickTime = 0;

      if (topElement && controls.isNode(topElement.id)) return;

      // finalActions, not actions: this fires later, on a real click, so it
      // needs the fully-composed action, not the fold-time snapshot
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
      sourceNode: { id: string },
      targetNode: { id: string },
    ) => {
      if (!optionsWithDefaults.allowSelfLoops) {
        const violatesRule = sourceNode.id === targetNode.id;
        if (violatesRule) return false;
      }

      if (!optionsWithDefaults.allowRepeatConnections) {
        const edgeBetweenToAndFrom = controls
          .edges()
          .find(
            (edge) =>
              edge.source === sourceNode.id && edge.target === targetNode.id,
          );

        const edgeBetweenFromAndTo = controls
          .edges()
          .find(
            (edge) =>
              edge.source === targetNode.id && edge.target === sourceNode.id,
          );

        const violatesRule = edgeBetweenToAndFrom || edgeBetweenFromAndTo;
        if (violatesRule) return false;
      }

      return controls.inspect.canAddEdge({
        source: sourceNode.id,
        target: targetNode.id,
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

      const canCreateEdge = doesEdgeConformToRules(sourceNode, targetNode);
      if (!canCreateEdge) return;

      // finalActions, not actions: this fires later, on anchor drop, so it
      // needs the fully-composed action, not the fold-time snapshot
      const edge = finalActions.addEdge({
        source: sourceNode.id,
        target: targetNode.id,
        weight: new Fraction(getValue(optionsWithDefaults.newEdgeWeight)),
      });
      if (!edge) return;

      controls.focus?.set([edge.id]);
      captureHistorySnapshot();
    };

    const removeFocusedElements = (e: KeyboardEvent) => {
      // the surface hands on every keystroke in the page, so a backspace aimed at an
      // edge weight field or a product panel must not delete the graph out from under it
      if (isTypingTarget(e)) return;
      if (e.key !== 'Backspace') return;
      finalActions.removeElements({
        nodes: controls.focus?.focusedNodes() ?? [],
        edges: controls.focus?.focusedEdges() ?? [],
      });
      captureHistorySnapshot();
    };

    const enable = () => {
      controls.surface.events.elements.subscribe(
        'onMouseDown',
        handleEdgeTextArea,
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
    };

    const disable = () => {
      controls.surface.events.elements.unsubscribe(
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
    };

    enable();

    return {
      name: 'interactive',
      controls: {
        lifecycle: {
          enable,
          disable,
        },
      },
    };
  };
