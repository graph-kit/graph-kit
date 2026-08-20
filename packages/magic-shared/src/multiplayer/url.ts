import { RoomId } from '@multiplayer/protocol/room';

import { queryParam, stripQueryParam, writeQueryParam } from '../url/index.ts';

const ROOM_QUERY_PARAM = 'room';

export const roomIdUrl = {
  read: () => queryParam(ROOM_QUERY_PARAM),
  write: (id: RoomId) => writeQueryParam(ROOM_QUERY_PARAM, id),
  strip: () => stripQueryParam(ROOM_QUERY_PARAM),
} as const;
