import { FocusControls } from '@graph/plugins/focus/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { ref } from 'vue';

// generic over the controls handed in, so everything the plugin exposes beyond
// FocusControls — its lifecycle above all — survives the wrapping
export const useFocus = <Controls extends FocusControls>(focus: Controls) => {
  const focusedNodes = ref<CoreNode[]>([...focus.focusedNodes()]);
  const focusedEdges = ref<CoreEdge[]>([...focus.focusedEdges()]);
  focus.events.subscribe('onFocusChange', () => {
    focusedNodes.value = [...focus.focusedNodes()];
    focusedEdges.value = [...focus.focusedEdges()];
  });
  return {
    ...focus,
    focusedNodes,
    focusedEdges,
  };
};
