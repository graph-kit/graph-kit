import { RoomId, UserId } from '@multiplayer/protocol/room';

import { queryParam, stripQueryParam, writeQueryParam } from '../url/index.ts';

const ROOM_QUERY_PARAM = 'room';
const JUMP_QUERY_PARAM = 'jump';

type RoomLinkParams = {
  roomId: RoomId;
  /** lands the arrival on this user's camera rather than wherever the page opens */
  jumpToUserId?: UserId;
};

export const roomIdUrl = {
  read: () => queryParam(ROOM_QUERY_PARAM),
  write: (id: RoomId) => writeQueryParam(ROOM_QUERY_PARAM, id),
  /** as href params, for a link that has to carry the room across a navigation */
  params: ({ roomId, jumpToUserId }: RoomLinkParams) => ({
    [ROOM_QUERY_PARAM]: roomId,
    ...(jumpToUserId && { [JUMP_QUERY_PARAM]: jumpToUserId }),
  }),
  strip: () => stripQueryParam(ROOM_QUERY_PARAM),
} as const;

export const jumpUserIdUrl = {
  read: () => queryParam(JUMP_QUERY_PARAM),
  /** as href params, for the link that starts the jump */
  params: (userId: UserId) => ({ [JUMP_QUERY_PARAM]: userId }),
  strip: () => stripQueryParam(JUMP_QUERY_PARAM),
} as const;
