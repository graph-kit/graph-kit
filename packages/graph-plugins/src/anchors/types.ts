import {
  GraphPlugin,
  WithEvents,
  WithLifecycle,
  WithTheme,
} from '@graph/plugins-shared/plugins';

import { FocusPlugin } from '../focus/types.ts';
import { SurfacePlugin } from '../surface/types.ts';
import { AnchorsEventMap } from './events.ts';
import { AnchorsThemes } from './themes.ts';

/**
 * an anchor instance that is attached to a node
 */
export type NodeAnchor = {
  /**
   * the x-coordinate of the anchor
   */
  x: number;
  /**
   * the y-coordinate of the anchor
   */
  y: number;
  /**
   * the direction of the anchor relative to the parent node.
   * ie the north anchor is the one that spawns above the node
   */
  direction: 'north' | 'east' | 'south' | 'west';
  /**
   * the unique id of the anchor
   */
  id: string;
};

export type AnchorsControls = WithEvents<
  WithTheme<{}, AnchorsThemes>,
  AnchorsEventMap
>;

export type AnchorsPlugin = GraphPlugin<{
  name: 'anchors';
  controls: WithLifecycle<AnchorsControls>;
  events: AnchorsEventMap;
  dependsOn: [SurfacePlugin];
  optionalDependsOn: [FocusPlugin];
}>;
