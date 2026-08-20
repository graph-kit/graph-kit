import {
  GraphPlugin,
  WithEvents,
  WithLifecycle,
  WithTheme,
} from '@graph/plugins-shared/plugins';

import { FocusPlugin } from '../focus/types.ts';
import { SurfacePlugin } from '../surface/types.ts';
import { MarqueeEventMap } from './events.ts';
import { MarqueeThemes } from './themes.ts';

export type MarqueeControls = WithEvents<
  WithTheme<{}, MarqueeThemes>,
  MarqueeEventMap
>;

export type MarqueePlugin = GraphPlugin<{
  name: 'marquee';
  controls: WithLifecycle<MarqueeControls>;
  events: MarqueeEventMap;
  dependsOn: [SurfacePlugin, FocusPlugin];
}>;
