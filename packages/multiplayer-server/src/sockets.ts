import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { createConnection } from './connection.ts';
import { registerDocumentEvents } from './document-events.ts';
import { DragSweepOptions, startDragSweep } from './drag-sweep.ts';
import { registerPresenceEvents } from './presence-events.ts';
import { registerProductEvents } from './product-events.ts';
import { registerRoomEvents } from './room-events.ts';
import { createRoomStore } from './rooms.ts';
import { ServerContext, SocketServer } from './types.ts';

type SocketServerOptions = {
  corsOrigins: string[];
  dragSweep?: DragSweepOptions;
};

export const createSocketServer = (
  httpServer: HttpServer,
  options: SocketServerOptions,
): SocketServer => {
  const io: SocketServer = new Server(httpServer, {
    cors: { origin: options.corsOrigins },
    // the backstop for a client that vanished without saying so, which the defaults
    // leave sitting in the roster for 45 seconds. the floor is how long a slow network
    // may swallow a pong before its owner is dropped, and dropping a host disbands
    pingInterval: 10_000,
    pingTimeout: 10_000,
  });

  const server: ServerContext = {
    io,
    rooms: createRoomStore(),
    connections: new Map(),
  };

  startDragSweep(server, options.dragSweep);

  io.on('connection', (socket) => {
    const connection = createConnection(server, socket);

    registerRoomEvents(connection);
    registerProductEvents(connection);
    registerDocumentEvents(connection);
    registerPresenceEvents(connection);
  });

  return io;
};
