import {
  GraphPlugin,
  WithEvents,
  WithLifecycle,
  WithTheme,
} from '@graph/plugins-shared/plugins';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { SurfacePlugin } from '../surface/types.ts';
import { FocusEventMap } from './events.ts';
import { FocusThemes } from './themes.ts';

type BaseFocusControls = {
  /**
   * Sets the focus to the element with the given ids
   *
   * @param ids the ids of the elements to focus
   */
  set: (ids: string[]) => void;
  /**
   * Removes all elements from focus
   */
  clear: () => void;
  /**
   * Sets the focus to every node and edge in the graph
   */
  setAll: () => void;
  /**
   * @param id the id of the element to check
   * @returns true if the element is focused
   */
  isFocused: (id: string) => boolean;
  /**
   * All the nodes that are focused
   */
  focusedNodes: () => CoreNode[];
  /**
   * All the edges that are focused
   */
  focusedEdges: () => CoreEdge[];
};

export type FocusControls = WithEvents<
  WithTheme<BaseFocusControls, FocusThemes>,
  FocusEventMap
>;

export type FocusPlugin = GraphPlugin<{
  name: 'focus';
  controls: WithLifecycle<FocusControls>;
  events: FocusEventMap;
  dependsOn: [SurfacePlugin];
}>;
