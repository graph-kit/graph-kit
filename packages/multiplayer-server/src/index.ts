import { createServer } from 'node:http';

import { createSocketServer } from './sockets.ts';

const PORT = Number(process.env.PORT ?? 3001);

// comma separated allowlist, since dev, deploy previews and prod all differ
const corsOrigins = (process.env.CORS_ORIGINS ?? '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const httpServer = createServer((request, response) => {
  // railway health check, the only http surface this server has
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404);
  response.end();
});

createSocketServer(httpServer, { corsOrigins });

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`multiplayer server listening on ${PORT}`);
});
