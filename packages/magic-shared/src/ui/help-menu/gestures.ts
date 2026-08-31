import {
  mdiCursorDefaultClick,
  mdiDragVariant,
  mdiGestureDoubleTap,
  mdiMouseRightClick,
  mdiMouseScrollWheel,
} from '@mdi/js';

import { Gesture } from './types.ts';

type GestureDisplay = {
  /** what it is called, since the icon alone rarely says which click it is */
  label: string;
  icon: string;
};

// exhaustive, so a gesture added to the union has to say how it reads before it compiles
export const GESTURE_DISPLAY: Record<Gesture, GestureDisplay> = {
  click: { label: 'Click', icon: mdiCursorDefaultClick },
  dblclick: { label: 'Double Click', icon: mdiGestureDoubleTap },
  contextmenu: { label: 'Right Click', icon: mdiMouseRightClick },
  drag: { label: 'Drag', icon: mdiDragVariant },
  wheel: { label: 'Scroll', icon: mdiMouseScrollWheel },
};
