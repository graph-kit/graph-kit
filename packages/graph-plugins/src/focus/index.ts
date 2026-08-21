import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { createEventHub } from '@core/events/createEventHub';
import { createThemeController } from '@core/themes/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import { createLifecycle } from '@graph/plugins-shared/lifecycle';
import { ElementRemovalPayload } from '@graph/primitives/transactions/types';
import { DeepReadonly } from 'ts-essentials';

import { NODE_DRAG_PLUGIN_ID } from '../node-drag/constants.ts';
import { FOCUS_PLUGIN_ID, INTERACTIVE_ELEMENT_SELECTOR } from './constants.ts';
import { createFocusEventRegistry } from './events.ts';
import { createFocusDetectors, createFocusThemeOverrides } from './themes.ts';
import { FocusPlugin } from './types.ts';

const sameIds = (previous: ReadonlySet<string>, next: ReadonlySet<string>) => {
  if (previous.size !== next.size) return false;
  for (const id of previous) if (!next.has(id)) return false;
  return true;
};

export const focus: FocusPlugin = ({ controls, events, getters }) => {
  const focusEventRegistry = createFocusEventRegistry();
  const focusEventHub = createEventHub(focusEventRegistry);

  let focusedElementIds: ReadonlySet<string> = new Set<string>();

  const isNodeOrEdge = (id: string) =>
    controls.isNode(id) || controls.isEdge(id);

  const commitFocus = (ids: Iterable<string>) => {
    const nextFocusedElementIds = new Set<string>();
    const unrecognizedIds: string[] = [];

    for (const id of ids) {
      if (isNodeOrEdge(id)) nextFocusedElementIds.add(id);
      else unrecognizedIds.push(id);
    }

    if (unrecognizedIds.length > 0) {
      console.warn('focus expected node or edge ids: got', unrecognizedIds);
    }

    if (sameIds(nextFocusedElementIds, focusedElementIds)) return;

    const previousFocusedElementIds = focusedElementIds;
    focusedElementIds = nextFocusedElementIds;

    focusEventHub.emit(
      'onFocusChange',
      focusedElementIds,
      previousFocusedElementIds,
    );
  };

  const setFocus = (ids: string[]) => commitFocus(ids);

  const clearFocus = () => commitFocus([]);

  const addToFocus = (id: string | Readonly<string[]>) =>
    commitFocus([...focusedElementIds, ...(Array.isArray(id) ? id : [id])]);

  const clearRemovedElementsFromFocus = ({
    removedNodeIds,
    removedEdgeIds,
  }: DeepReadonly<ElementRemovalPayload>) => {
    const hasRemovedFocus =
      removedNodeIds.some(isFocused) || removedEdgeIds.some(isFocused);

    if (!hasRemovedFocus) return;

    const removedIds = new Set<string>([...removedNodeIds, ...removedEdgeIds]);

    const newFocusedIds = Array.from(focusedElementIds).filter(
      (id) => !removedIds.has(id),
    );

    setFocus(newFocusedIds);
  };

  const handleMouseDown = ({ topElement, event }: ElementMouseEvent) => {
    if (event.button !== MOUSE_BUTTONS.left) return;
    if (!topElement) {
      if (!event.shiftKey) clearFocus();
      return;
    }

    // decorative elements sitting above the graph (marquee selection box, anchors) preserve focus rather than taking it
    if (!isNodeOrEdge(topElement.id)) return;

    if (event.shiftKey) addToFocus(topElement.id);
    else setFocus([topElement.id]);
  };

  const clearFocusOnOutsideClick = ({ target }: MouseEvent) => {
    if (!(target instanceof Element)) return;
    if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) return;
    clearFocus();
  };

  const setFocusToAll = () => {
    const nodeIds = controls.nodes().map((node) => node.id);
    const edgeIds = controls.edges().map((edge) => edge.id);
    setFocus([...nodeIds, ...edgeIds]);
  };

  const isFocused = (id: string) => focusedElementIds.has(id);

  const onEnable = () => {
    // focus a node when clicked, or clear focus if background is clicked
    controls.surface.events.elements.handle(
      'onMouseDown',
      handleMouseDown,
      FOCUS_PLUGIN_ID,
      {
        before: [NODE_DRAG_PLUGIN_ID],
      },
    );
    controls.surface.events.dom.subscribe(
      'onMouseDown',
      clearFocusOnOutsideClick,
    );

    // clean up the focus so removed elements aren't in the state
    events.subscribe('onElementsRemoved', clearRemovedElementsFromFocus);
  };

  const onDisable = () => {
    controls.surface.events.elements.unhandle('onMouseDown', handleMouseDown);
    controls.surface.events.dom.unsubscribe(
      'onMouseDown',
      clearFocusOnOutsideClick,
    );

    events.unsubscribe('onElementsRemoved', clearRemovedElementsFromFocus);
    clearFocus();
  };

  const lifecycle = createLifecycle({
    onEnable,
    onDisable,
  });

  lifecycle.enable();

  const theme = createThemeController(createFocusThemeOverrides());

  return {
    name: 'focus',
    controls: {
      set: setFocus,
      clear: clearFocus,
      setAll: setFocusToAll,
      isFocused,
      focusedNodes: () => controls.nodes().filter((node) => isFocused(node.id)),
      focusedEdges: () => controls.edges().filter((edge) => isFocused(edge.id)),
      events: focusEventHub,
      theme: {
        ...theme,
        detectors: createFocusDetectors(isFocused, theme._resolveToken),
      },
      lifecycle,
    },
    onAfterInit: () => {
      const weightLayer = theme.createLayer(
        FOCUS_PLUGIN_ID + '/theme/edge-weight',
      );
      weightLayer.set('edge.focus.text.content', (edge) => {
        if (!controls.isEdge(edge.id)) return;
        return getters.getEdge(edge.id).weight.toFraction();
      });
    },
  };
};
