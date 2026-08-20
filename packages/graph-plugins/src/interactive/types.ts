import { GraphPlugin, WithLifecycle } from '@graph/plugins-shared/plugins';

import { AnchorsPlugin } from '../anchors/types.ts';
import { FocusPlugin } from '../focus/types.ts';
import { HistoryPlugin } from '../history/types.ts';
import { SurfacePlugin } from '../surface/types.ts';

export type InteractivePlugin = GraphPlugin<{
  name: 'interactive';
  controls: WithLifecycle<{}>;
  dependsOn: [SurfacePlugin];
  optionalDependsOn: [AnchorsPlugin, FocusPlugin, HistoryPlugin];
}>;
