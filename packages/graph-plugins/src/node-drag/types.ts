import { Coordinate } from '@canvas/surface/types';
import {
  GraphPlugin,
  WithEvents,
  WithLifecycle,
} from '@graph/plugins-shared/plugins';
import { CoreNode } from '@graph/primitives/types';

import { FocusPlugin } from '../focus/types.ts';
import { HistoryPlugin } from '../history/types.ts';
import { MarqueePlugin } from '../marquee/types.ts';
import { SurfacePlugin } from '../surface/types.ts';
import { NodeDragEventMap } from './events.ts';

export type NodeIdDragState = { nodeIds: string[] };

/**
 * info for the node being dragged
 */
export type ActiveDragNode = {
  nodeId: CoreNode['id'];
  coords: Coordinate;
};

export type NodeDragControls = WithEvents<{}, NodeDragEventMap>;

export type NodeDragPlugin = GraphPlugin<{
  name: 'nodeDrag';
  controls: WithLifecycle<NodeDragControls>;
  events: NodeDragEventMap;
  dependsOn: [SurfacePlugin];
  optionalDependsOn: [FocusPlugin, MarqueePlugin, HistoryPlugin];
}>;
