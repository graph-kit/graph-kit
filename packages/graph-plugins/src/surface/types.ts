import type { CanvasSurface } from '@canvas/surface/types';
import { GraphPlugin, WithTheme } from '@graph/plugins-shared/plugins';

import { SurfaceThemes } from './themes.ts';

export type { ElementsUnderCursor as GraphUnderCursor } from '@canvas/surface/events/index';

/**
 * the whole surface, spread rather than nested: everything a plugin reaches for on it
 * (`aggregator`, `events`, `camera`, `shapes`) is what this plugin is for, so making
 * callers write `surface.surface` to get at any of it buys nothing.
 */
type BaseSurfaceControls = CanvasSurface & {
  getNodePriority: () => (nodeId: string) => number;
};

export type SurfaceControls = WithTheme<BaseSurfaceControls, SurfaceThemes>;

type SurfaceTransitPayload = {
  panX: number;
  panY: number;
  zoom: number;
};

export type SurfacePlugin = GraphPlugin<{
  name: 'surface';
  controls: SurfaceControls;
  transit: SurfaceTransitPayload;
}>;
