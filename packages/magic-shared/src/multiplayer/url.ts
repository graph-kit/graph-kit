import { RoomId } from '@multiplayer/protocol/room';

const ROOM_QUERY_PARAM = 'room';

const readRoomIdFromUrl = () =>
  new URL(window.location.href).searchParams.get(ROOM_QUERY_PARAM);

const writeRoomIdToUrl = (id: RoomId) => {
  const url = new URL(window.location.href);
  url.searchParams.set(ROOM_QUERY_PARAM, id);
  window.history.replaceState({}, '', url);
};

const stripRoomIdFromUrl = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(ROOM_QUERY_PARAM)) return;
  url.searchParams.delete(ROOM_QUERY_PARAM);
  window.history.replaceState({}, '', url);
};

export const roomIdUrl = {
  read: readRoomIdFromUrl,
  write: writeRoomIdToUrl,
  strip: stripRoomIdFromUrl,
} as const;
