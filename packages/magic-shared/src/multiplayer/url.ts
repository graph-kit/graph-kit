import { RoomId, UserId } from '@multiplayer/protocol/room';

import { queryParam, stripQueryParam, writeQueryParam } from '../url/index.ts';

const ROOM_QUERY_PARAM = 'room';
const JUMP_QUERY_PARAM = 'jump';

export const roomIdUrl = {
  read: () => queryParam(ROOM_QUERY_PARAM),
  write: (id: RoomId) => writeQueryParam(ROOM_QUERY_PARAM, id),
  strip: () => stripQueryParam(ROOM_QUERY_PARAM),
} as const;

/**
 * A jump at someone in another experience rides in the url rather than in memory,
 * because the click that starts it is a real navigation and nothing in memory survives
 * one. Read on arrival by whichever experience the link landed on.
 */
export const jumpUserIdUrl = {
  read: () => queryParam(JUMP_QUERY_PARAM),
  /** as href params, for the link that starts the jump */
  params: (userId: UserId) => ({ [JUMP_QUERY_PARAM]: userId }),
  strip: () => stripQueryParam(JUMP_QUERY_PARAM),
} as const;
