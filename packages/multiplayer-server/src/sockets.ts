import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { createConnection } from './connection.ts';
import { registerDocumentEvents } from './document-events.ts';
import { DragSweepOptions, startDragSweep } from './drag-sweep.ts';
import { registerPresenceEvents } from './presence-events.ts';
import { registerProductEvents } from './product-events.ts';
import { registerRoomEvents } from './room-events.ts';
import { RoomSweepOptions, startRoomSweep } from './room-sweep.ts';
import { createRoomStore } from './rooms.ts';
import { ServerContext, SocketServer } from './types.ts';

type SocketServerOptions = {
  corsOrigins: string[];
  dragSweep?: DragSweepOptions;
  roomSweep?: RoomSweepOptions;
};

export const createSocketServer = (
  httpServer: HttpServer,
  options: SocketServerOptions,
): SocketServer => {
  const io: SocketServer = new Server(httpServer, {
    cors: { origin: options.corsOrigins },
    // how long a member who vanished without saying so goes on looking present, which
    // the defaults leave at 45 seconds. dropping one is cheap now that a seat outlives
    // its socket: it costs them a greyed roster row and their cursor until they are back
    pingInterval: 10_000,
    pingTimeout: 10_000,
  });

  const server: ServerContext = {
    io,
    rooms: createRoomStore(),
    connections: new Map(),
  };

  startDragSweep(server, options.dragSweep);
  startRoomSweep(server, options.roomSweep);

  io.on('connection', (socket) => {
    const connection = createConnection(server, socket);

    registerRoomEvents(connection);
    registerProductEvents(connection);
    registerDocumentEvents(connection);
    registerPresenceEvents(connection);
  });

  return io;
};
