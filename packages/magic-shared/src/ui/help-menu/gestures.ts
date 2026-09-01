import {
  mdiCursorDefaultClick,
  mdiDragVariant,
  mdiGestureDoubleTap,
  mdiMouseRightClick,
  mdiMouseScrollWheel,
} from '@mdi/js';

import { Gesture } from './types.ts';

type GestureDisplay = {
  label: string;
  icon: string;
};

export const GESTURE_DISPLAY: Record<Gesture, GestureDisplay> = {
  click: { label: 'Click', icon: mdiCursorDefaultClick },
  dblclick: { label: 'Double Click', icon: mdiGestureDoubleTap },
  contextmenu: { label: 'Right Click', icon: mdiMouseRightClick },
  drag: { label: 'Drag', icon: mdiDragVariant },
  wheel: { label: 'Scroll', icon: mdiMouseScrollWheel },
};
