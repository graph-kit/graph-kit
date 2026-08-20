import { Annotation, AnnotationsControls } from '@core/annotations/index';
import {
  GraphPlugin,
  WithLifecycle,
  WithTheme,
} from '@graph/plugins-shared/plugins';

import { HistoryPlugin } from '../history/types.ts';
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
  optionalDependsOn: [HistoryPlugin];
}>;
