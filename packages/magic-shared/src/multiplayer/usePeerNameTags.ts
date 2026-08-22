import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';
import { circle } from '@canvas/primitives/shapes/circle/index';
import { rect } from '@canvas/primitives/shapes/rect/index';
import { TEXT_BLOCK_DEFAULTS } from '@canvas/primitives/text/defaults';
import { getTextDimensions } from '@canvas/primitives/text/getTextDimensions';
import type { TextBlock } from '@canvas/primitives/text/types';
import { CanvasSurface } from '@canvas/surface/types';

import { onUnmounted } from 'vue';

import { tierColor } from '../ui/multiplayer/tier.ts';
import { ProductMultiplayer } from './types.ts';

const NAME_TAG_HEIGHT = 20;
const NAME_TAG_PADDING_X = 8;
const NAME_TAG_MAX_CHARS = 10;
const NAME_TAG_TRUNCATED_CHARS = 8;

const CURSOR_DOT_RADIUS = 3;

/** keeps the plate off the dot instead of tucked under it */
const NAME_TAG_OFFSET = 6;

const ANNOTATING_EMOJI = '✏️';

const toDisplayedName = (name: string) =>
  name.length > NAME_TAG_MAX_CHARS
    ? `${name.slice(0, NAME_TAG_TRUNCATED_CHARS)}...`
    : name;

type PeerNameTagOptions = {
  surface: CanvasSurface;
  multiplayer: ProductMultiplayer;
};

/**
 * Where every peer's pointer is: a dot on the spot itself, with the plate naming whoever
 * owns it hung off its top left, so the point being made stays the pixel they picked
 * rather than a corner of a box.
 */
export const usePeerNameTags = ({
  surface,
  multiplayer,
}: PeerNameTagOptions) => {
  const nameTagElements: AggregatorTransformer = (agg) => {
    const room = multiplayer.room.state.value;
    if (!room.connected) return agg;

    const roster = room.userIdToRosterEntry;
    for (const [userId, presence] of Object.entries(room.userIdToPresence)) {
      if (!presence.cursorPosition) continue;

      const { displayName, tier } = roster[userId];
      const color = tierColor[tier];

      const name = toDisplayedName(displayName);
      const textBlock: Required<TextBlock> = {
        ...TEXT_BLOCK_DEFAULTS,
        content: presence.isAnnotating ? `${ANNOTATING_EMOJI} ${name}` : name,
        fontWeight: 'bold',
        color: 'white',
      };

      const nameTagId = userId + '_nameTag';
      const nameTagWidth =
        getTextDimensions(textBlock).width + NAME_TAG_PADDING_X * 2;

      const nameTag: CanvasElement = {
        id: nameTagId,
        priority: Infinity,
        paintOnly: true,
        shape: rect({
          at: {
            x: presence.cursorPosition.x - nameTagWidth - NAME_TAG_OFFSET,
            y: presence.cursorPosition.y - NAME_TAG_HEIGHT - NAME_TAG_OFFSET,
          },
          height: NAME_TAG_HEIGHT,
          width: nameTagWidth,
          fillColor: color,
          borderRadius: 5,
          textArea: { id: nameTagId, textBlock },
        }),
      };

      const cursorDot: CanvasElement = {
        id: userId + '_cursorDot',
        priority: Infinity,
        paintOnly: true,
        shape: circle({
          at: presence.cursorPosition,
          radius: CURSOR_DOT_RADIUS,
          fillColor: color,
        }),
      };

      agg.push(nameTag, cursorDot);
    }

    return agg;
  };

  const show = () => surface.aggregator.addTransformer(nameTagElements);
  const hide = () => surface.aggregator.removeTransformer(nameTagElements);

  // mounting into a room the connection is already in is a navigation, not a join
  if (multiplayer.room.state.value.connected) show();

  multiplayer.events.subscribe('onRoomJoined', show);
  multiplayer.events.subscribe('onRoomLeft', hide);

  // the connection outlives the product
  onUnmounted(() => {
    multiplayer.events.unsubscribe('onRoomJoined', show);
    multiplayer.events.unsubscribe('onRoomLeft', hide);
    hide();
  });
};
