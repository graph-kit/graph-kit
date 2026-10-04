import { ANCHOR_PLUGIN_ID } from '../anchors/constants.ts';
import { FOCUS_PLUGIN_ID } from '../focus/constants.ts';
import { INTERACTIVE_PLUGIN_ID } from '../interactive/constants.ts';
import { MARQUEE_PLUGIN_ID } from '../marquee/constants.ts';
import { NODE_DRAG_PLUGIN_ID } from '../node-drag/constants.ts';

export const ANNOTATION_PLUGIN_ID = 'plugins/annotations';

/**
 * annotations take the pointer ahead of everything that acts on the graph itself, which
 * is what stops a stroke from dragging a node or opening a marquee under it
 */
export const ANNOTATION_HANDLER_PRIORITY = {
  before: [
    MARQUEE_PLUGIN_ID,
    NODE_DRAG_PLUGIN_ID,
    ANCHOR_PLUGIN_ID,
    FOCUS_PLUGIN_ID,
    INTERACTIVE_PLUGIN_ID,
  ],
} as const;

export const ANNOTATION_THEME_LAYER_ID = 'plugins/annotations';
