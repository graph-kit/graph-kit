import { Annotation, AnnotationsControls } from '@core/annotations/index';
import {
  GraphPlugin,
  WithLifecycle,
  WithTheme,
} from '@graph/plugins-shared/plugins';

import { AnchorsPlugin } from '../anchors/types.ts';
import { HistoryPlugin } from '../history/types.ts';
import { MarqueePlugin } from '../marquee/types.ts';
import { NodeDragPlugin } from '../node-drag/types.ts';
import { SurfacePlugin } from '../surface/types.ts';
import { AnnotationsThemes } from './themes.ts';

export type AnnotationsPluginControls = WithLifecycle<
  WithTheme<AnnotationsControls, AnnotationsThemes>
>;

export type AnnotationsPlugin = GraphPlugin<{
  name: 'annotations';
  controls: AnnotationsPluginControls;
  transit: Annotation[];
  dependsOn: [SurfacePlugin];
  optionalDependsOn: [
    AnchorsPlugin,
    HistoryPlugin,
    MarqueePlugin,
    NodeDragPlugin,
  ];
}>;
