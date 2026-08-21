import { GraphPlugin, WithEvents } from '@graph/plugins-shared/plugins';

import { AnchorsPlugin } from '../anchors/types.ts';
import { AnnotationsPlugin } from '../annotations/types.ts';
import { HistoryPlugin } from '../history/types.ts';
import { InteractivePlugin } from '../interactive/types.ts';
import { NodeDragPlugin } from '../node-drag/types.ts';
import { ReadonlyEventMap } from './events.ts';

export type ReadonlyControls = {
  /** holds every guarded plugin disabled until {@link ReadonlyControls.exit | exit} */
  enter: () => void;
  /** hands the guarded plugins back to whatever their last caller asked for */
  exit: () => void;
  /** @returns true while readonly is held */
  isActive: () => boolean;
  /**
   * @returns the name of every plugin readonly found to guard. a plugin absent from the
   * graph, or folded after readonly, is not in here and is not being held down
   */
  guarding: () => string[];
};

export type ReadonlyPlugin = GraphPlugin<{
  name: 'readonly';
  controls: WithEvents<ReadonlyControls, ReadonlyEventMap>;
  events: ReadonlyEventMap;
  optionalDependsOn: [
    InteractivePlugin,
    AnchorsPlugin,
    NodeDragPlugin,
    AnnotationsPlugin,
    HistoryPlugin,
  ];
}>;
