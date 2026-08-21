import { RoomId, UserId } from '@multiplayer/protocol/room';

import { queryParam, stripQueryParam, writeQueryParam } from '../url/index.ts';

const ROOM_QUERY_PARAM = 'room';
const JUMP_QUERY_PARAM = 'jumpTo';

export const roomIdUrl = {
  read: () => queryParam(ROOM_QUERY_PARAM),
  write: (id: RoomId) => writeQueryParam(ROOM_QUERY_PARAM, id),
  strip: () => stripQueryParam(ROOM_QUERY_PARAM),
} as const;

/**
 * Who this load is meant to land on, for a jump at somebody in another experience. In the
 * url rather than in memory because changing experience is a document load, which takes
 * anything held in a module with it. Written only by the link that starts the jump.
 */
export const jumpToUrl = {
  read: () => queryParam(JUMP_QUERY_PARAM),
  param: (userId: UserId) => ({ [JUMP_QUERY_PARAM]: userId }),
  strip: () => stripQueryParam(JUMP_QUERY_PARAM),
} as const;
