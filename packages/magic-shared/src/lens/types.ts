import { PartiallyPartial } from '@core/utils/types';

import { ComponentSlot } from '../component-slot/types.ts';

/**
 * A perspective in which to view or frame canvas surface elements.
 * Defines component slots plus activate/deactivate for whatever effects that perspective requires.
 */
export type Lens = {
  id: string;
  /** Component slots this lens renders into the shell. */
  components?: PartiallyPartial<ComponentSlot, 'id'>[];
  /** Applies whatever this lens does when it becomes active. Not restricted to theming, can be any side effect in the spirit of a lens. */
  activate?: () => void;
  /** Reverses everything activate did, restoring prior state when the lens becomes inactive. */
  deactivate?: () => void;
};
